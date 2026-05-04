# Smart Diagram Generator - Complete Project Documentation

## 1. Project Overview
The **Smart Diagram Generator** is a professional-grade, full-stack application designed to create, manage, and export diagrams. It specializes in **Entity-Relationship (ER)** and **Data Flow Diagrams (DFD)**, featuring an intuitive drag-and-drop interface powered by React Flow and advanced AI generation capabilities using Google Gemini.

---

## 2. Key Features
- **Interactive Canvas**: Professional drag-and-drop interface with grid snapping.
- **Diagram Varieties**:
    - **ER Diagrams**: Entities, Relationships, Attributes, Key Attributes (Primary Keys).
    - **DFD**: Processes, External Entities, Data Stores, Data Flows.
- **AI-Powered Generation**: 
    - Text-to-Diagram: Describe a system, and the AI builds the layout.
    - Vision-to-Diagram: Upload a sketch or image, and the AI converts it into editable nodes.
- **Smart Validation**: Real-time checking for diagram integrity (missing keys, M:N relationships).
- **Export Options**: 
    - High-quality **PNG** images.
    - Portable **JSON** data for saving and re-importing.
- **Cloud Integration**: Integration with Firebase for persistent storage and authentication.

---

## 3. Technology Stack

### Frontend
- **Framework**: React 19
- **Diagram Engine**: [@xyflow/react](https://reactflow.dev) (formerly React Flow)
- **Styling**: Vanilla CSS with modern dark-themed aesthetics.
- **Icons**: Lucide React
- **Authentication/Storage**: Firebase

### Backend
- **Platform**: Node.js with Express.js
- **AI Engine**: Groq (LPU Inference Engine) with Llama-3 / Mixtral
- **Security**: Helmet, CORS, Express Rate Limit
- **Storage**: In-memory (Mock) + Firebase support

---

## 4. Project Structure
```text
smart-diagram/
├── backend/                # Node.js Express server & AI integration
├── frontend/               # React application & Diagram canvas
├── package.json            # Root configuration for unified control
├── server.js               # Root launcher for the backend
└── README.md               # Project overview and quick start
```

---

## 5. Getting Started

### Prerequisites
- Node.js (v16.0.0 or higher)
- npm or yarn

### 1. Unified Setup (Recommended)
From the project root:
```bash
npm run install-all   # Installs dependencies for all modules
npm run dev           # Starts both Frontend and Backend concurrently
```

### 2. Manual Setup
If you prefer running them separately:

**Backend**:
```bash
cd backend
npm install
npm start
```

**Frontend**:
```bash
cd frontend
npm install
npm start
```
*The application will be accessible at `http://localhost:3000`.*

---

## 6. AI Integration Details
The application uses **Groq (LPU Inference)** for ultra-high-speed, accurate diagram generation.

### Prompt Engineering
The AI is instructed using structured "System Prompts" that enforce:
- **Shape Mapping**: e.g., mapping "Entity" to a blue rectangle (#eff6ff).
- **Positioning Logic**: Radial star layouts for ER attributes and vertical/branching flows for flowcharts.
- **Strict Output**: Returns 100% valid JSON compatible with the React Flow schema.

---

## 7. API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Health check and AI status |
| `POST` | `/api/ai/generate` | Generates diagram JSON from a text prompt |
| `POST` | `/api/ai/parse-image` | Parses an uploaded image into diagram nodes |
| `POST` | `/api/diagrams/save` | Saves a diagram state to the backend |
| `GET` | `/api/diagrams` | Retrieves all saved diagrams |

---

## 8. Deployment Roadmap
- [x] **MVP**: Drag-and-drop, basic shapes, and PNG export.
- [x] **v2.0**: AI Generation, validation engine, and dark theme.
- [ ] **v3.0**: Real-time collaboration, SQL schema generation, and full Mobile responsiveness.
