# Kortex

## How to Run

```bash
# ----------------------------------------------------
# 🐍 TERMINAL 1: BACKEND (FastAPI)
# ----------------------------------------------------
cd backend

# Create the virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server (Running at: http://localhost:8000)
uvicorn main:app --reload


# ----------------------------------------------------
# ⚛️ TERMINAL 2: FRONTEND (React + pnpm)
# ----------------------------------------------------
cd frontend

# Install dependencies using pnpm
pnpm install

# Start the development server (Running at: http://localhost:5173)
pnpm dev
