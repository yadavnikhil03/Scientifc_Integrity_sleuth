# Scientific Integrity Sleuth 🔬

[![Live Demo](https://img.shields.io/badge/Live_Demo-Online-success?style=for-the-badge)](https://scientifc-integrity-sleuth.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.style=for-the-badge)](LICENSE)
[![Frontend](https://img.shields.io/badge/Vite-React-blue?style=for-the-badge&logo=vite)](frontend/)
[![Backend](https://img.shields.io/badge/FastAPI-Python-green?style=for-the-badge&logo=fastapi)](backend/)

A professional-grade AI forensic tool designed to detect image manipulation, cloning, splicing, and data inconsistencies in scientific research papers.

**🚀 Live Application:** [https://scientifc-integrity-sleuth.vercel.app/](https://scientifc-integrity-sleuth.vercel.app/)

---

## 📖 Overview

Scientific fraud via image manipulation (e.g., duplicated Western blots, cloned cell cultures, and spliced microscopy) is a growing problem. **Scientific Integrity Sleuth** acts as a fully-automated "laboratory console" for researchers, reviewers, and journal editors to upload visual evidence and receive instant deterministic anomaly reports.

The application features a unique, high-immersion **Deep Space / Brutalist UI** designed to feel like operating advanced laboratory telemetry equipment. 

---

## ⚡ Core Features

- **Advanced Anomaly Scanning:** Detects splicing artifacts, cloning, and error-level discrepancies using simulated neural pipelines.
- **Dual-Mode Telemetry UI:**
  - *Inspector Mode:* Visually highlights bounding boxes of suspected manipulations.
  - *Dev Console:* Streams raw system logs, latency metrics, and API payloads in real-time.
- **Thermal Lab Reports:** Generates printable, heavily styled receipts summarizing the forensic findings with exact precision indices.
- **Interactive Data Archives:** Stores historical scan results for cross-referencing past specimens.
- **Dark/Light Mode:** Seamless global theme transitions optimized for long-session laboratory viewing.

---

## 🏗️ System Architecture

### Frontend: Laboratory UI
- **Framework:** React + Vite
- **Styling:** Tailwind CSS + custom CSS variables for complex deep-space themes.
- **Animations:** Framer Motion for particle bursts, smooth view transitions, and pulsing telemetry metrics.
- **Design Pattern:** Modular architecture cleanly separating the `Sidebar`, `Viewport` (Main Content), `AnalysisPanel`, and `ReceiptModal`.

### Backend: Forensic Core
- **Framework:** FastAPI (Python 3.12+)
- **Validation:** Pydantic models for strict type checking and automated API schema generation.
- **Asynchronous Execution:** Built for high-concurrency analysis processing.
- **CI/CD:** Automated builds tested against robust Pytest endpoints.

---

## 🔄 User Workflow

1. **Specimen Intake:** Users upload an image (e.g., a Western blot or microscopy scan) to the secure dropzone.
2. **Telemetry Uplink:** The image is transmitted to the backend while the UI transitions to a simulated "neural sync" loading phase.
3. **Forensic Scanning:** The backend evaluates the image content, mapping anomalies and generating a deterministic integrity coefficient.
4. **Findings Review:** The frontend renders the anomaly bounding boxes over the image and outputs a strict finding log.
5. **Lab Report Generation:** The user generates a printable thermal receipt containing all telemetry data and confidence scores.

---

## 🗺️ Development Roadmap

While the core pipeline is operational, we have a lot of exciting work planned to evolve this into a complete production-grade system:

- [ ] **Real AI Model Integration:** Replace the simulated deterministic backend with actual Computer Vision models (e.g., Error Level Analysis, CNN-based splicing detection).
- [ ] **PDF Parsing Pipeline:** Allow users to upload full PDF research papers to automatically extract and scan all embedded figures.
- [ ] **User Authentication:** Secure accounts for researchers to save their archives and track their scans over time via Supabase/Firebase.
- [ ] **Batch Processing:** Ability to upload multiple images at once and generate a comprehensive portfolio report.
- [ ] **Browser Extension:** A plug-and-play extension to right-click images on publisher websites and scan them instantly.

---

## 🛠️ Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- Python (v3.12+)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Unix/MacOS:
# source venv/bin/activate
pip install -r requirements.txt
python main.py
```
*The API runs at `http://localhost:8000`. Swagger documentation is available at `/docs`.*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*The UI runs at `http://localhost:5173`.*

---

## 🚀 Deployment

This monorepo is fully configured for continuous deployment using modern serverless infrastructure.

- **Frontend:** Hosted on [Vercel](https://vercel.com).
- **Backend:** Hosted on [Render](https://render.com) (Pinned to Python 3.12 via `.python-version` to ensure fast pre-compiled wheel installations).
- **Integration:** The `vercel.json` and Vite configurations automatically route production traffic to the live Render endpoint.

---

## 🧪 Verification & Testing

**Backend Testing (Pytest):**
```bash
cd backend
python -m pytest tests/test_main.py
```

**Frontend End-to-End Testing (Playwright):**
```bash
cd frontend
npx playwright test
```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
