# ♻️ Plastic Waste Segregation System

## 📌 Project Description

The Plastic Waste Segregation System is an AI-powered application designed to automatically classify different types of plastic waste using machine learning techniques. The system aims to improve recycling efficiency by reducing manual sorting and minimizing human error.

Plastic waste is one of the major environmental concerns worldwide. Improper segregation leads to contamination, making recycling difficult and inefficient. This project provides an intelligent solution by integrating computer vision and deep learning to identify plastic types in real time.

---

## 🎯 Objectives

- To develop an automated system for plastic waste classification
- To reduce human effort in waste segregation
- To improve accuracy and speed of recycling processes
- To apply machine learning concepts to solve real-world environmental problems

---

## ⚙️ System Workflow

1. User uploads an image of plastic waste through the web interface
2. The image is sent to the backend server (Flask API)
3. The backend preprocesses the image:
   - Resizes to 224×224 pixels
   - Normalizes pixel values
4. The trained ML model predicts the plastic type
5. The prediction and confidence score are returned to the frontend
6. The result is displayed to the user

---

## 🧠 Machine Learning Approach

- Model Used: MobileNetV2 (Transfer Learning)
- Framework: TensorFlow / Keras
- Input: Image (224×224 RGB)
- Output: Probability distribution over plastic classes

### 📊 Classes:
- HDPE (High-Density Polyethylene)
- LDPA (Low-Density Polyethylene)
- PET (Polyethylene Terephthalate)
- PP (Polypropylene)
- PS (Polystyrene)
- PVC (Polyvinyl Chloride)
- Other

---


