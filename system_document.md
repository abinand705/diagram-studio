# System Architecture & Technical Specifications

## Overview
The Smart Diagramming Workspace is a high-fidelity web application designed for professional-grade ER Diagramming and Flowcharting. It leverages modern React patterns and LPU-accelerated AI for intelligent diagram generation.

## Technical Stack
- **Frontend**: 
  - **Framework**: React 19
  - **Diagramming Library**: React Flow (v12) / @xyflow/react
  - **Styling**: Vanilla CSS with custom animations and glassmorphism.
  - **Icons**: Lucide-React
- **Backend**:
  - **Runtime**: Node.js
  - **AI SDK**: Groq SDK (LLaMA 3 70B / 8B)
  - **Database**: Firebase (Firestore for diagrams, Auth for Google login)
- **Deployment**: Localhost development (Frontend: 3000, Backend: 5000)

## Layout Engine Specifications (v3.4)
- **Algorithm**: Custom Linear-Chain Graph Layout.
- **Node IDs**: Deterministic, prefixed with `ai_` and timestamp.
- **Connection Ports**: Quad-port universal handles + Dual-port explicit Chen handles.
- **Edge Routing**: Orthogonal 'Step' edges with `strokeWidth: 2`.

## UI/UX Standards
- **Aesthetics**: Premium Dark/Light theme support, interactive mouse-glow effects, and spring-loaded node entrances.
- **Mobile First**: Specialized touch interaction logic, increased handle snap distance, and orbital loaders.
- **Persistence**: Real-time cloud sync with Firebase and local JSON export/import.

## Maintenance
- **Doc Integrity**: Preservation of original comments and architectural patterns.
- **Extensibility**: Modular shape configuration in `ShapesConfig.js`.
