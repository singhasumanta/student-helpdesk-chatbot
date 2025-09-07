
# Student Helpdesk Chatbot — Full Stack (React + Flask + Dataset)
👉 Problem: Students repeatedly ask the same queries (admissions, exams, campus info), overloading staff.

👉 Solution: AI-powered chatbot with FAQ + semantic search + GPT fallback, giving instant and reliable answers.

- **Frontend:** React + Vite + Tailwind
- **Backend:** Flask (Python), TF‑IDF FAQ retrieval
- **Dataset:** `backend/faq_dataset.json` (easy to edit/extend)

## 1) Quick Start

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # (Windows: .venv\Scripts\activate)
pip install -r requirements.txt
# optional: copy .env
python app.py
```
Backend runs at **http://localhost:5000**.

### Frontend
```bash
cd frontend
# Node 18+ recommended
npm install
# optional: cp .env.example .env and set VITE_API_BASE if different
npm run dev
```
Open the printed local URL (usually `http://localhost:5173`).

## 2) How it works

- Frontend calls `POST /api/chat` with `{ message }`.
- Backend uses TF‑IDF + cosine similarity to find the closest question in the dataset.
- If similarity ≥ threshold (default 0.35), return the matched answer.
- Otherwise, return a helpful fallback response (you can wire an LLM here).

## 3) Customize the dataset
Edit `backend/faq_dataset.json`. Add items like:
```json
{ "question": "How do I apply for admissions?", "answer": "..." }
```
Restart backend to reload.

## 4) Optional: Adjust retrieval threshold
Set `SIMILARITY_THRESHOLD` in `backend/.env` (e.g., 0.25 for looser matching).

## 5) Deploy notes
- Enable CORS on backend (already included).
- Serve frontend as static site (Vite build) and host backend separately (Render/Heroku/EC2).
- Add logging, auth, and rate limiting as needed.
```


## Upgraded: Searchable FAQ + Semantic Search + GPT fallback


