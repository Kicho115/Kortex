# Kortex

## How to Run

### Create a .env File
Create a `.env` file in the `backend` directory with the following content:

```env
LLM_API_KEY=your-api-key
LLM_API_URL=your-api-url
LLM_MODEL=your-model
```

And create a `.env` file in the `frontend` directory with the following content:

```env
VITE_API_URL=http://your-backend-ip:8000
VITE_WS_URL=ws://your-backend-ip:8000
```

### Start the Backend and Frontend
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
uvicorn main:app --reload --host 0.0.0.0

# ----------------------------------------------------
# ⚛️ TERMINAL 2: FRONTEND (React + pnpm)
# ----------------------------------------------------
cd frontend

# Install dependencies using pnpm
pnpm install

# Start the development server (Running at: http://localhost:5173)
pnpm dev
