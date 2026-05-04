# 🎨 Smart Diagram Generator

> **Professional-grade, AI-powered diagramming tool for the modern web.**

The **Smart Diagram Generator** is a feature-rich, full-screen application designed for creating complex engineering and data diagrams with ease. It combines the flexibility of an infinite canvas with the power of Google's Gemini 1.5 AI models.

![Main Interface Mockup](https://raw.githubusercontent.com/lucide-react/lucide/main/icons/frame.svg)

---

## 🚀 Key Features

### 🤖 Gemini AI Integration
- **Text-to-Diagram**: Describe your system in natural language, paste a **SQL Schema**, or upload **JSON** to generate structural diagrams (ERD, DFD, Flowcharts) instantly.
* **AI Vision Parsing**: Upload a screenshot of an existing diagram or a photo of a hand-drawn sketch, and the AI will convert it into editable digital shapes.
- **Append Mode**: Intelligently add AI-generated shapes next to your existing work without overwriting anything.

### 🌗 Premium UI & UX
- **Dynamic Dark Mode**: A sleek, theme-aware interface that adapts to your environment.
- **Infinite Canvas**: Powered by `@xyflow/react` for high-performance pan/zoom.
- **Precision Tools**: Integrated Rulers, Guides, and a Mini-Map for large-scale system architecture.
- **Page Management**: Multi-page workspace with A4/A3/Letter support and visual boundaries.

### ☁️ Cloud & Collaborative (Firebase)
- **Google Sign-In**: Secure access to premium AI features and cloud storage.
- **Cloud Persistence**: Save your diagrams to Firestore and access them from anywhere.
- **Sharable Links**: Generate unique links to share your diagrams with others.

### 📥 Import & Export
- **Export Formats**: High-resolution PNG and SVG exports.
- **JSON Portability**: Import/Export workspace files to keep your data local.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, React Flow (@xyflow/react), Lucide Icons, Tailwind-inspired Vanilla CSS.
- **Backend**: Node.js, Express, Google Generative AI (Gemini 1.5).
- **Authentication/Storage**: Firebase Auth, Firestore.
- **Image Processing**: Multer, Gemini Vision API.

---

## 🏁 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16.x or higher)
- [Firebase account](https://firebase.google.com/) (for cloud features)
- [Google AI Studio API Key](https://aistudio.google.com/) (for real AI features)

### 2. Quick Start (Unified)
From the root folder:
```bash
npm run install-all    # Install all dependencies
npm run dev            # Start both servers concurrently
```

### 3. Production Deployment
1. Build the frontend: `npm run build` from root.
2. Start the production server: `npm start` from root.
*The backend is configured to serve the React production build automatically.*

---

## ⚙️ Manual Activation of AI
To unlock the full accuracy of the AI (beyond simulation mode):
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/).
2. Open the **AI Assistant** panel in the app side-nav.
3. Go to the **Settings** tab and paste your key.
4. Click **Activate AI**.

---

## 📋 Folder Structure
- `/frontend`: React application source, UI components, and state logic.
- `/backend`: Node.js server, Gemini AI routes, and file handling.
- `/artifacts`: Project documentation and architecture logs.

---

## 📜 License
This project is licensed under the MIT License.
