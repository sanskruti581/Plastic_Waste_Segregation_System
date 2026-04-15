# Plastic Waste Segregation System

Full-stack application for classifying plastic waste images into:
`HDPE`, `LDPA`, `Other`, `PET`, `PP`, `PS`, `PVC`.

## Project Structure

```text
Plastic_waste_seggregation/
  backend/
    app.py
    plastic_model.keras
    class_names.json
    requirements.txt
  frontend/
    index.html
    style.css
    script.js
```

## Backend Setup (Flask)

1. Open a terminal in the project root.
2. Install dependencies:
   ```powershell
   pip install -r backend/requirements.txt
   ```
3. Start the API:
   ```powershell
   python backend/app.py
   ```

API endpoint:
- `POST http://127.0.0.1:5000/predict` with form-data key `file`.

## Frontend Setup

1. Open `frontend/index.html` in your browser (or serve `frontend/` via any static server).
2. Upload an image and click **Predict Plastic Type**.

The frontend calls:
- `http://127.0.0.1:5000/predict`

## Prediction Output Format

```json
{
  "predicted_class": "PET",
  "confidence": 0.92
}
```
