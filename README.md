# Smart Cairo Transportation Network Optimization

This repository is prepared for the CSE112 project.

## Stack
- React + Vite frontend
- Python FastAPI backend
- Python/scikit-learn ML traffic prediction bonus

## Data
Ready JSON data is stored in:

```text
backend/app/data/
```

## GitHub Workflow
Keep `main` as the stable branch with the prepared structure and data.
Create feature branches from `main` or from a future `dev` branch when your team starts coding.

## Run Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Run Frontend

```bash
cd frontend-react
npm install
npm install react-router-dom framer-motion
npm run dev
```

## Docker

```bash
docker compose up --build
```
