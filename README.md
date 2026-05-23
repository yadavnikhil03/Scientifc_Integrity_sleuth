# Scientific Integrity Sleuth 🕵️‍♂️🔬

A professional-grade AI forensic tool designed to detect image manipulation and data inconsistencies in scientific research.

## 🔬 System Architecture

### Frontend: Modern Laboratory UI
- **Modular Components:** Built with a clean separation of concerns (`Sidebar`, `Viewport`, `AnalysisPanel`, `ForensicReport`).
- **Custom Hooks:** Business logic is encapsulated in `useAnalysis`, isolating side effects from the UI.
- **Performance Optimized:** Utilizes `React.memo`, `useCallback`, and efficient re-render strategies to maintain high FPS even during intense scanning.
- **Dual-Mode View:** 
  - **Inspector Mode:** Intuitive visual findings for researchers.
  - **Dev Console:** Raw system logs and real-time latency metrics for developers.
- **Tech Stack:** React + Vite + Tailwind CSS + Framer Motion + Lucide Icons.

### Backend: Forensic Core
- **FastAPI Framework:** High-performance asynchronous API handling.
- **Pydantic Validation:** Strict data modeling and auto-generated API documentation.
- **Automated Testing:** Comprehensive suite using `pytest` and `httpx` to verify endpoint stability.
- **Health Monitoring:** Built-in integrity checks and system metrics streaming.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.13+)

### Installation & Execution

#### 1. Backend Setup
```bash
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt # (Ensure requirements.txt is up to date)
python main.py
```
*The API is available at `http://localhost:8000`. Documentation: `/docs`.*

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*The UI is available at `http://localhost:5173` (or the next available port).*

## 🧪 Verification
To run the backend test suite:
```bash
cd backend
python -m pytest tests/test_main.py
```

## 📜 License
MIT
