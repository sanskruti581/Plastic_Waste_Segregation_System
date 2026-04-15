import json
import logging
import os
from typing import List

import numpy as np
import tensorflow as tf
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image, UnidentifiedImageError

IMAGE_SIZE = (224, 224)
MODEL_FILENAME = "plastic_model.keras"
CLASS_NAMES_FILENAME = "class_names.json"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, MODEL_FILENAME)
CLASS_NAMES_PATH = os.path.join(BASE_DIR, CLASS_NAMES_FILENAME)

LOGGER = logging.getLogger(__name__)


def load_class_names(file_path: str) -> List[str]:
    with open(file_path, "r", encoding="utf-8") as json_file:
        class_names = json.load(json_file)

    if not isinstance(class_names, list) or not all(
        isinstance(name, str) for name in class_names
    ):
        raise ValueError("class_names.json must be a JSON array of strings.")

    return class_names


def load_model(file_path: str) -> tf.keras.Model:
    dense_class = tf.keras.layers.Dense

    # Compatibility patch for .keras files that include quantization metadata
    # not recognized by the current Dense layer constructor.
    if not getattr(dense_class, "_compat_patch_applied", False):
        original_from_config = dense_class.from_config

        @classmethod
        def patched_from_config(cls, config):
            if isinstance(config, dict):
                config = dict(config)
                config.pop("quantization_config", None)
            return original_from_config(config)

        dense_class.from_config = patched_from_config
        dense_class._compat_patch_applied = True

    return tf.keras.models.load_model(file_path, compile=False)


def model_has_layer_type(model: tf.keras.Model, layer_type: type) -> bool:
    for layer in getattr(model, "layers", []):
        if isinstance(layer, layer_type):
            return True
        if hasattr(layer, "layers") and model_has_layer_type(layer, layer_type):
            return True
    return False


def preprocess_image(uploaded_file, normalize: bool) -> np.ndarray:
    with Image.open(uploaded_file.stream) as image:
        image = image.convert("RGB")
        image = image.resize(IMAGE_SIZE)
        image_array = np.asarray(image, dtype=np.float32)
        if normalize:
            image_array = image_array / 255.0

    return np.expand_dims(image_array, axis=0)


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    class_names = load_class_names(CLASS_NAMES_PATH)
    model = load_model(MODEL_PATH)
    model_uses_rescaling = model_has_layer_type(model, tf.keras.layers.Rescaling)
    normalize_input_in_api = not model_uses_rescaling

    output_units = int(model.output_shape[-1])
    if output_units != len(class_names):
        raise ValueError(
            f"Model output units ({output_units}) do not match class_names count "
            f"({len(class_names)})."
        )

    @app.post("/predict")
    def predict():
        if "file" not in request.files:
            return jsonify({"error": "No image file found in request."}), 400

        uploaded_file = request.files["file"]
        if uploaded_file.filename == "":
            return jsonify({"error": "No image selected."}), 400

        try:
            input_batch = preprocess_image(uploaded_file, normalize=normalize_input_in_api)
        except UnidentifiedImageError:
            return jsonify({"error": "Invalid image format."}), 400
        except Exception as error:
            LOGGER.exception("Failed to preprocess image: %s", error)
            return jsonify({"error": "Unable to preprocess image."}), 500

        try:
            predictions = model.predict(input_batch, verbose=0)
            probabilities = predictions[0]
            predicted_index = int(np.argmax(probabilities))
            predicted_class = class_names[predicted_index]
            confidence = float(probabilities[predicted_index])
        except Exception as error:
            LOGGER.exception("Prediction failed: %s", error)
            return jsonify({"error": "Prediction failed."}), 500

        response = {
            "predicted_class": predicted_class,
            "confidence": round(confidence, 4),
        }

        debug_enabled = request.args.get("debug", "").lower() in {"1", "true", "yes"}
        if debug_enabled:
            response["probabilities"] = {
                class_name: round(float(probability), 6)
                for class_name, probability in zip(class_names, probabilities)
            }

        return jsonify(response)

    @app.get("/health")
    def health():
        return jsonify(
            {
                "status": "ok",
                "model_loaded": True,
                "class_count": len(class_names),
                "preprocess_mode": "api_normalize"
                if normalize_input_in_api
                else "model_rescaling",
            }
        )

    return app


app = create_app()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    app.run(host="0.0.0.0", port=5000, debug=False)
