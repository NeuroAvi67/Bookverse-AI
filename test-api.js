/**
 * ==============================================================================
 * BOOKVERSE AI — AUTOMATED TEST SUITE & ENDPOINT VERIFICATION
 * ==============================================================================
 * Validates:
 * 1. Healthcheck & System Telemetry Endpoint
 * 2. Book Search & Metadata Normalization (Google Books & Open Library Fallback)
 * 3. Curated Showcase Endpoint
 * 4. Multi-Tier Summary Synthesis Engine
 * 5. Deep Research Dossier & Academic Citation Pipeline
 * 6. Contextual AI Conversational Assistant
 * 7. Multi-Book Comparative Epistemology Matrix
 * ==============================================================================
 */

const http = require('http');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log(`================================================================`);
  console.log(`🧪 BOOKVERSE AI — AUTOMATED TEST SUITE RUNNER`);
  console.log(`📡 Target Server: ${BASE_URL}`);
  console.log(`================================================================\n`);

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`• Testing: ${name}... `);
      await fn();
      console.log(`\x1b[32m[PASS]\x1b[0m`);
      passed++;
    } catch (err) {
      console.log(`\x1b[31m[FAIL]\x1b[0m -> ${err.message}`);
      failed++;
    }
  }

  // 1. Health Check
  await test('Server Health & Capability Flags (/api/health)', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'online') throw new Error('Expected status: online');
    if (!Array.isArray(data.capabilities)) throw new Error('Expected capabilities array');
  });

  // 2. Curated Showcase
  await test('Curated Masterworks Showcase (/api/books/curated/showcase)', async () => {
    const res = await fetch(`${BASE_URL}/api/books/curated/showcase`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.curated) || data.curated.length === 0) {
      throw new Error('Expected non-empty curated books array');
    }
    const dune = data.curated.find(b => b.title === 'Dune');
    if (!dune || !dune.isbn) throw new Error('Dune must include valid ISBN');
  });

  // 3. Book Search
  await test('Real-Time Book Search & Normalization (/api/books/search?q=Dune)', async () => {
    const res = await fetch(`${BASE_URL}/api/books/search?q=Dune&limit=5`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.books) || data.books.length === 0) {
      throw new Error('Search returned no books');
    }
    const first = data.books[0];
    if (!first.title || !first.authors || !first.coverImage) {
      throw new Error('Book missing normalized fields (title, authors, coverImage)');
    }
  });

  // 4. Multi-Tier Summaries
  await test('Multi-Tier Literary Summary Synthesis (/api/ai/summary)', async () => {
    const res = await fetch(`${BASE_URL}/api/ai/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookTitle: 'Deep Work',
        author: 'Cal Newport'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.summary || !data.summary.oneMinuteSummary || !data.summary.fiveMinuteSummary) {
      throw new Error('Summary missing 1-minute or 5-minute tier');
    }
  });

  // 5. Deep Research Dossier
  await test('Academic Deep Research Pipeline (/api/ai/research)', async () => {
    const res = await fetch(`${BASE_URL}/api/ai/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookTitle: 'Sapiens',
        author: 'Yuval Noah Harari',
        isbn: '9780062316097'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const d = data.dossier;
    if (!d || !d.centralThesis || !Array.isArray(d.verifiedFacts) || !Array.isArray(d.academicCitations)) {
      throw new Error('Dossier missing thesis, verifiedFacts, or academicCitations');
    }
    if (typeof d.confidenceScore !== 'number') {
      throw new Error('Dossier must provide confidence score');
    }
  });

  // 6. Contextual AI Assistant
  await test('Contextual AI Book Assistant (/api/ai/assistant)', async () => {
    const res = await fetch(`${BASE_URL}/api/ai/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookTitle: 'Meditations',
        author: 'Marcus Aurelius',
        userQuery: 'What is the central idea of this book?'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.reply || typeof data.reply !== 'string' || data.reply.length < 20) {
      throw new Error('Invalid assistant reply payload');
    }
  });

  // 7. Multi-Book Comparison Matrix
  await test('Multi-Book Comparison Matrix (/api/books/compare)', async () => {
    const res = await fetch(`${BASE_URL}/api/books/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        books: [
          { title: 'Deep Work', authors: ['Cal Newport'] },
          { title: 'Atomic Habits', authors: ['James Clear'] }
        ]
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const c = data.comparison;
    if (!c || !c.thematicMatrix || !Array.isArray(c.thematicMatrix)) {
      throw new Error('Comparison missing thematic matrix');
    }
  });

  console.log(`\n================================================================`);
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log(`================================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Check if running directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
