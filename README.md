# Scientific Integrity Sleuth

A professional-grade AI forensic tool designed to detect image manipulation and data inconsistencies in scientific research.

## System Architecture

### Frontend: Laboratory UI
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

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.13+)

### Installation & Execution

#### 1. Backend Setup
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
*The API is available at `http://localhost:8000`. Documentation is available at `/docs`.*

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*The UI is available at `http://localhost:5173` (or the next available port).*

## Verification & Testing
To run the backend test suite:
```bash
cd backend
python -m pytest tests/test_main.py
```

To run the frontend Playwright E2E suite:
```bash
cd frontend
npx playwright test
```

## Documentation

The project includes full API documentation automatically generated via Swagger UI at `/docs` on the backend server.
For frontend development, standard React component documentation is available in the source codebase.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
