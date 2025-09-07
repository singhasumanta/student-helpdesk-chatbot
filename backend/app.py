import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# --- Optional: semantic search ---
USE_EMBEDDINGS = False
try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
    try:
        import faiss
        FAISS_AVAILABLE = True
    except Exception:
        FAISS_AVAILABLE = False
    if FAISS_AVAILABLE:
        USE_EMBEDDINGS = True
except Exception:
    FAISS_AVAILABLE = False
    USE_EMBEDDINGS = False

# --- GPT fallback (Groq API) ---
USE_GPT = False
GROQ_KEY = os.environ.get("GROQ_API_KEY")

if GROQ_KEY:
    try:
        from groq import Groq
        client = Groq(api_key=GROQ_KEY)
        USE_GPT = True
    except Exception as e:
        print("Groq init error:", e)
        USE_GPT = False

# --- Initialize Flask ---
app = Flask(__name__, static_folder="static")
CORS(app)

# --- Load dataset ---
DATASET_PATH = os.environ.get("FAQ_DATASET", os.path.join(os.path.dirname(__file__), "faq_dataset.json"))
SIMILARITY_THRESHOLD = float(os.environ.get("SIMILARITY_THRESHOLD", "0.35"))

with open(DATASET_PATH, "r", encoding="utf-8") as f:
    FAQ = json.load(f)

QA_LIST = [item for item in FAQ if "question" in item and "answer" in item]
QUESTIONS = [item["question"] for item in QA_LIST]
ANSWERS = [item["answer"] for item in QA_LIST]
CATEGORIES = [item.get("category", "General") for item in QA_LIST]

# --- Build TF-IDF model ---
vectorizer = TfidfVectorizer(stop_words="english")
question_matrix = vectorizer.fit_transform(QUESTIONS)

# --- Optional semantic embeddings ---
if USE_EMBEDDINGS:
    model = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings = model.encode(QUESTIONS, convert_to_numpy=True)
    import faiss
    d = embeddings.shape[1]
    faiss_index = faiss.IndexFlatL2(d)
    faiss_index.add(embeddings.astype("float32"))

# --- Helper functions ---
def retrieve_answer_tfidf(query: str):
    if not query.strip():
        return None, 0.0, None, None
    q_vec = vectorizer.transform([query])
    sims = cosine_similarity(q_vec, question_matrix).flatten()
    best_idx = int(sims.argmax())
    best_sim = float(sims[best_idx])
    return (ANSWERS[best_idx], best_sim, QUESTIONS[best_idx], CATEGORIES[best_idx])

def retrieve_answer_semantic(query: str):
    if not USE_EMBEDDINGS:
        return None, 0.0, None, None
    q_emb = model.encode([query], convert_to_numpy=True).astype("float32")
    D, I = faiss_index.search(q_emb, 1)
    idx = int(I[0][0])
    dist = float(D[0][0])
    score = max(0.0, 1.0 - (dist / 10.0))
    return (ANSWERS[idx], score, QUESTIONS[idx], CATEGORIES[idx])

def gpt_fallback(query: str):
    if not USE_GPT:
        return None
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a helpful assistant for university students."},
                {"role": "user", "content": query}
            ]
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print("Groq error:", e)
        return None

# --- API routes ---
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "use_embeddings": USE_EMBEDDINGS, "use_gpt": USE_GPT})

@app.route("/api/faq", methods=["GET"])
def faq_search():
    query = request.args.get("query", "").strip()
    if not query:
        return jsonify({"error": "Please provide ?query=..."}), 400

    answer, score, matched_q, category = retrieve_answer_tfidf(query)
    if score >= SIMILARITY_THRESHOLD:
        return jsonify({"source": "tfidf", "match_score": round(score,3), "matched_question": matched_q, "answer": answer, "category": category})

    if USE_EMBEDDINGS:
        answer_s, score_s, matched_q_s, category_s = retrieve_answer_semantic(query)
        if score_s >= SIMILARITY_THRESHOLD:
            return jsonify({"source": "semantic", "match_score": round(score_s,3), "matched_question": matched_q_s, "answer": answer_s, "category": category_s})

    if USE_GPT:
        gpt_reply = gpt_fallback(query)
        if gpt_reply:
            return jsonify({"source": "gpt", "match_score": 0.0, "matched_question": None, "answer": gpt_reply, "category": "General"})

    return jsonify({"source": "none", "match_score": round(score,3), "matched_question": matched_q, "answer": "Sorry, I couldn't find an answer in the FAQ.", "category": category or "General"})

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(force=True)
    message = (data or {}).get("message", "")
    if not message:
        return jsonify({"error": "empty message"}), 400

    ans, score, m_q, cat = retrieve_answer_tfidf(message)
    if score >= SIMILARITY_THRESHOLD:
        return jsonify({"source": "tfidf", "match_score": round(score,3), "matched_question": m_q, "reply": ans, "category": cat})

    if USE_EMBEDDINGS:
        ans_s, score_s, m_q_s, cat_s = retrieve_answer_semantic(message)
        if score_s >= SIMILARITY_THRESHOLD:
            return jsonify({"source": "semantic", "match_score": round(score_s,3), "matched_question": m_q_s, "reply": ans_s, "category": cat_s})

    if USE_GPT:
        gpt_reply = gpt_fallback(message)
        if gpt_reply:
            return jsonify({"source": "gpt", "match_score": 0.0, "matched_question": None, "reply": gpt_reply, "category": "General"})

    fallback = "I couldn't find an exact answer in the FAQ. Please check the portal or provide more details."
    return jsonify({"source": "none", "match_score": round(score,3), "matched_question": m_q, "reply": fallback, "category": cat or "General"})

# --- React frontend catch-all ---
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    if path != "" and os.path.exists(os.path.join("static", path)):
        return send_from_directory("static", path)
    else:
        return send_from_directory("static", "index.html")

# --- Run app ---
if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
