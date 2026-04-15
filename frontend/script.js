const API_URL = "http://127.0.0.1:5000/predict";

const navbar = document.getElementById("navbar");
const navLinks = document.querySelectorAll(".nav-link");
const tryNowBtn = document.getElementById("tryNowBtn");

const imageInput = document.getElementById("imageInput");
const dropZone = document.getElementById("dropZone");
const selectedFileName = document.getElementById("selectedFileName");
const predictButton = document.getElementById("predictButton");
const buttonLabel = document.getElementById("buttonLabel");
const buttonSpinner = document.getElementById("buttonSpinner");
const statusMessage = document.getElementById("statusMessage");

const previewSection = document.getElementById("previewSection");
const imagePreview = document.getElementById("imagePreview");

const resultSection = document.getElementById("resultSection");
const predictedClass = document.getElementById("predictedClass");
const confidenceScore = document.getElementById("confidenceScore");
const confidenceFill = document.getElementById("confidenceFill");

let selectedFile = null;
let previewUrl = null;

wireNavigation();
wireUpload();

function wireNavigation() {
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = link.getAttribute("href");
      const target = targetId ? document.querySelector(targetId) : null;
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  tryNowBtn.addEventListener("click", () => {
    const uploadSection = document.getElementById("upload");
    uploadSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  window.addEventListener("scroll", onWindowScroll);
  onWindowScroll();
}

function wireUpload() {
  imageInput.addEventListener("change", (event) => {
    const [file] = event.target.files;
    handleFileSelection(file);
  });

  dropZone.addEventListener("click", () => imageInput.click());
  dropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      imageInput.click();
    }
  });

  dropZone.addEventListener("dragenter", onDragOverZone);
  dropZone.addEventListener("dragover", onDragOverZone);
  dropZone.addEventListener("dragleave", onDragLeaveZone);
  dropZone.addEventListener("drop", onDropZone);

  predictButton.addEventListener("click", onPredictClick);
}

function onWindowScroll() {
  navbar.classList.toggle("nav-scrolled", window.scrollY > 10);
  highlightActiveNav();
}

function highlightActiveNav() {
  const sectionMap = [
    { id: "home", selector: '.nav-link[href="#home"]' },
    { id: "upload", selector: '.nav-link[href="#upload"]' },
    { id: "about", selector: '.nav-link[href="#about"]' },
  ];

  const scrollY = window.scrollY + 130;
  let activeSelector = sectionMap[0].selector;

  sectionMap.forEach((sectionMeta) => {
    const section = document.getElementById(sectionMeta.id);
    if (section && scrollY >= section.offsetTop) {
      activeSelector = sectionMeta.selector;
    }
  });

  navLinks.forEach((link) => link.classList.remove("active"));
  const activeLink = document.querySelector(activeSelector);
  if (activeLink) {
    activeLink.classList.add("active");
  }
}

function onDragOverZone(event) {
  event.preventDefault();
  dropZone.classList.add("drag-over");
}

function onDragLeaveZone(event) {
  event.preventDefault();
  dropZone.classList.remove("drag-over");
}

function onDropZone(event) {
  event.preventDefault();
  dropZone.classList.remove("drag-over");
  const [file] = event.dataTransfer.files;
  if (file) {
    handleFileSelection(file);
  }
}

function handleFileSelection(file) {
  clearResult();

  if (!file) {
    selectedFile = null;
    selectedFileName.textContent = "No file selected";
    previewSection.classList.add("hidden");
    setStatus("", "");
    return;
  }

  if (!file.type.startsWith("image/")) {
    selectedFile = null;
    imageInput.value = "";
    selectedFileName.textContent = "No file selected";
    previewSection.classList.add("hidden");
    setStatus("Please choose a valid image file.", "error");
    return;
  }

  selectedFile = file;
  selectedFileName.textContent = file.name;
  showPreview(file);
  setStatus("Image selected. Click Upload & Predict to continue.", "");
}

async function onPredictClick() {
  if (!selectedFile) {
    setStatus("Please upload an image before prediction.", "error");
    return;
  }

  setLoading(true);
  setStatus("Running prediction...", "");

  const formData = new FormData();
  formData.append("file", selectedFile);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Prediction failed.");
    }

    const predictedType = result.predicted_class || "Unknown";
    const confidencePercent = clampToPercent(
      typeof result.confidence === "number" ? result.confidence * 100 : 0
    );

    predictedClass.textContent = predictedType;
    confidenceScore.textContent = `${confidencePercent.toFixed(2)}%`;
    confidenceFill.style.width = `${confidencePercent.toFixed(2)}%`;

    applyConfidenceState(confidencePercent);

    resultSection.classList.remove("hidden");
    resultSection.classList.remove("animate-in");
    void resultSection.offsetWidth;
    resultSection.classList.add("animate-in");

    setStatus("Prediction completed successfully.", "success");
    resultSection.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    setStatus(error.message || "Unable to connect to backend API.", "error");
  } finally {
    setLoading(false);
  }
}

function applyConfidenceState(confidencePercent) {
  resultSection.classList.remove("state-high", "state-medium", "state-low");

  if (confidencePercent >= 75) {
    resultSection.classList.add("state-high");
    return;
  }

  if (confidencePercent >= 45) {
    resultSection.classList.add("state-medium");
    return;
  }

  resultSection.classList.add("state-low");
}

function clampToPercent(value) {
  return Math.max(0, Math.min(value, 100));
}

function setLoading(isLoading) {
  predictButton.disabled = isLoading;
  buttonSpinner.classList.toggle("hidden", !isLoading);
  buttonLabel.textContent = isLoading ? "Predicting..." : "Upload & Predict";
}

function clearResult() {
  predictedClass.textContent = "-";
  confidenceScore.textContent = "-";
  confidenceFill.style.width = "0%";
  resultSection.classList.remove("state-high", "state-medium", "state-low");
  resultSection.classList.add("hidden");
}

function setStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = "status";
  if (type) {
    statusMessage.classList.add(type);
  }
}

function showPreview(file) {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }

  previewUrl = URL.createObjectURL(file);
  imagePreview.src = previewUrl;
  previewSection.classList.remove("hidden");
}
