# BOOKVERSE AI — The Futuristic AI-Powered 3D Digital Library

![BookVerse AI](https://images.unsplash.com/photo-1507842229452-972108169990?auto=format&fit=crop&w=1200&q=80)

> **"Where Literature Meets Artificial Intelligence"**  
> A production-oriented digital library where users discover books in interactive 3D, unpack multi-tier literary syntheses, generate academic research dossiers with verified citations, and converse with contextual AI companions.

---

## 1. System Highlights

1. **Interactive 3D Hardcover Book Engine**:
   - Built with Three.js and GSAP physics.
   - Realistic hardcover proportions, curved spine cylinder, ivory pages block with depth, and ambient champagne/navy lighting.
   - Front cover pivot animation that swings open ~160° upon interaction.
   - Dynamic cover texture generation via Canvas & Google Books API.
   - Automatic 2D fallback for weaker devices and reduced-motion accessibility.

2. **Intelligent Multi-Criteria Book Search**:
   - Live integration with the **Google Books API** and **Open Library API**.
   - Search by Title, Author, Topic/Subject, Concept, or ISBN.
   - Normalized metadata: high-resolution covers, authors, publishers, publication dates, page counts, ratings, and descriptions.

3. **AI Deep Research Engine (Zero-Hallucination Pipeline)**:
   - 10-stage academic research protocol.
   - Strictly categorizes findings into:
     - **Verified Facts & Empirical Foundations**
     - **Author's Original Arguments**
     - **External Interpretations & Critiques**
     - **Academic Consensus vs. Open Debates**
     - **Bibliographic Citations & Archival Sources** (Primary, Secondary, Peer-Reviewed)
   - Quantitative confidence & rigor scoring.

4. **Multi-Tier AI Book Summary System**:
   - **1-Minute Core**: Executive headline, core takeaway, and 3 key pillars.
   - **5-Minute Frameworks**: Background context, central thesis, major conceptual frameworks, and practical lessons.
   - **15-Minute Comprehensive**: Exhaustive synthesis, thematic arcs, critical analysis (strengths vs. limitations), and target audience mapping.
   - **Chapter-by-Chapter Breakdown**: Analytical breakdown of specific sections.

5. **Contextual AI Book Assistant**:
   - Grounded conversation companion with the active book loaded directly into system context.
   - Model switching between Google Gemini (`gemini-2.5-flash`) and OpenAI (`gpt-4o`).
   - Critically examines author assumptions, explains complex ideas with analogies, and contrasts with contemporaneous literature.

6. **Neural Audiobook Player & Narration**:
   - Integrated Web Speech API speech synthesis for authentic audio narration of summaries and chapters.
   - Full playback controls: play/pause, variable speed (0.75x to 2.0x), 15s skip, seek bar, time tracking, and customizable sleep timer.

7. **Multi-Book Comparative Epistemology Matrix**:
   - Side-by-side comparison between any two books.
   - Thematic dimension matrix, shared principles, fundamental divergences, and reading sequence recommendations.

8. **Personal Library & Dual-Mode Persistence**:
   - Works immediately out-of-the-box using local-first browser storage (`localStorage`).
   - Cloud sync ready with **Supabase PostgreSQL & Auth**.

---

## 2. Architecture & File Structure

```
bookverse-ai/
├── public/
│   ├── index.html            # Luxury Dark Cinematic Web UI & 3D Stage
│   ├── style.css             # Midnight Navy & Champagne Gold Theme
│   ├── three-book.js         # Three.js & GSAP 3D Hardcover Book Engine
│   └── app.js                # Core Application & State Controller
├── server.js                 # Express API Proxy & AI Provider Abstraction
├── test-api.js               # Automated Test Suite for All Endpoints
├── package.json              # Project Configuration & Dependencies
├── .env.example              # Environment Configuration Template
└── README.md                 # System Documentation & Runbook
```

---

## 3. Quick Start Guide

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn

### Installation
```bash
# Navigate to the project directory
cd bookverse-ai

# Install dependencies
npm install
```

### Configuration (.env)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your API keys (optional — high-fidelity curated canon mode runs automatically if keys are omitted):
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### Running the Application
```bash
# Start the server
npm start
# or for development
npm run dev
```

Open your browser at:
```
http://localhost:5000
```

---

## 4. API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health, capability matrix, and provider telemetry. |
| `GET` | `/api/books/search?q=...&type=...` | Live book search via Google Books & Open Library. |
| `GET` | `/api/books/:id` | Detailed metadata for a single volume. |
| `GET` | `/api/books/curated/showcase` | Curated masterworks showcase for the homepage. |
| `POST` | `/api/ai/research` | Deep research pipeline with claim categorization & citations. |
| `POST` | `/api/ai/summary` | Generates 1m, 5m, 15m, and chapter summaries. |
| `POST` | `/api/ai/assistant` | Contextual conversational companion for the active book. |
| `POST` | `/api/books/compare` | Multi-dimensional comparison matrix for two or more volumes. |

---

## 5. Automated Testing

Verify all backend endpoints, search normalization, and AI synthesis pipelines:
```bash
node test-api.js
```

---

## 6. Deployment Guide

### Deploying to Render / Railway / Heroku
1. Push the repository to GitHub.
2. Create a new **Web Service** pointing to the repository.
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `node server.js`
5. Configure Environment Variables: `GEMINI_API_KEY`, `PORT=5000`.

### Deploying via Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

---

## 7. Epistemic & Copyright Standards
BookVerse AI strictly adheres to fair use and intellectual property laws:
- Summaries and dossiers are original analytical syntheses created to accelerate understanding.
- Unabridged copyrighted books are not reproduced.
- Audio generated via the platform is clearly designated as AI narration.
- Authentic archival bibliographic indices are prioritized over fabricated references.
