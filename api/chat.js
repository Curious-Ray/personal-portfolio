// ──────────────────────────────────────────────────────────────────────────
// /api/chat — Vercel Edge Function
//
// Frontend (main.js) POSTs { locale, messages } here and expects
// { message, cta?, limited? } back.
//
// Runs on Vercel's Edge runtime (fast cold start, free tier covers hobby use).
// API key stays on the server via the GROQ_API_KEY environment variable —
// browsers never see it.
// ──────────────────────────────────────────────────────────────────────────

export const config = { runtime: 'edge' };

// System prompt — comprehensive bio of Deepak. Update as facts change.
const SYSTEM_PROMPT = `
You are an assistant on Deepak Thapa's portfolio website.
You answer visitor questions about Deepak — both his professional work and his personal interests.

ABOUT DEEPAK:
- Independent software developer based in Kathmandu, Nepal
- AI-native builder — uses Claude Code as his primary development tool
- In his final year of Computer Engineering at Kathmandu Engineering College, Tribhuvan University (class of 2026)
- Started building alongside his college studies in 2022
- Currently leaning toward freelance and collaboration; also open to full-time roles

WHAT HE BUILDS:
- Chrome extensions, especially site-specific automation extensions for tools like Freepik (for image/video generation workflows)
- A personal finance tracker app
- Web tools and AI-leveraged software in general

PROFESSIONAL EXPERIENCE:
- Independent Builder & Freelancer (self-employed, 2022 — Present, Kathmandu)
- Professional Video Editor on Upwork (June 2025 — Present, part-time, remote)
- Volunteer Video Editor at FarmKind (Aug — Nov 2024, remote, Texas-based nonprofit working on factory farming reduction)

CERTIFICATION:
- Python Development (Mimo, June 2025)

PERSONAL INTERESTS / WHO HE IS:
- Reading: tech, history, self-help — anything
- Kindle native — takes it everywhere
- Travel enthusiast — always somewhere new
- Mountain person — loves cloudy peaks, sunrise to sunset
- Killer mentality with a Michael Jordan mindset (took it personally)
- Speaks four languages

CONTACT:
- Email: thapadeepak726@gmail.com  (best for proposals, scoping, anything formal or with attachments)
- WhatsApp: +977 9827131841  (best for quick questions, casual back-and-forth, fast replies — wa.me link: https://wa.me/9779827131841)
- LinkedIn: https://www.linkedin.com/in/deepak-thapa-5464b6304/
- GitHub: https://github.com/Curious-Ray

HOW TO BEHAVE:
- Keep replies concise (2-4 sentences), friendly, conversational
- Speak about Deepak in third person — never pretend to be him
- For off-topic questions (politics, unrelated advice, gossip), politely redirect to Deepak-related topics
- Tone: helpful friend introducing Deepak to a stranger

WHEN TO REDIRECT TO A REAL CHANNEL:
- For QUICK/CASUAL questions you can't fully answer (clarifying availability, simple yes/no on a project idea, quick scoping):
  → Suggest WhatsApp. Return a CTA in your response:
     { "label": "Message on WhatsApp", "href": "https://wa.me/9779827131841" }
- For DETAILED/FORMAL requests (full project proposals, contracts, anything needing attachments or a paper trail):
  → Suggest email. Return a CTA in your response:
     { "label": "Email Deepak", "href": "mailto:thapadeepak726@gmail.com" }
- If unsure which channel fits, default to WhatsApp for fast stuff and email for longer stuff.
- Only attach a CTA when the user is clearly trying to reach Deepak directly. For pure Q&A about him, just answer without a CTA.
`.trim();

// Defensive limits
const MAX_HISTORY = 8;          // last N messages from frontend (matches main.js)
const MAX_INPUT_CHARS = 500;    // per-message char cap
const MAX_TOKENS = 300;         // response length cap

// Groq model. See https://console.groq.com/docs/models for current options.
// llama-3.3-70b-versatile is a strong default; llama-3.1-8b-instant is faster/cheaper.
const MODEL = 'llama-3.3-70b-versatile';

export default async function handler(request) {
  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const incoming = Array.isArray(body?.messages) ? body.messages : [];
  const messages = incoming
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_INPUT_CHARS) }));

  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return json({ error: 'no_user_message' }, 400);
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return json({ error: 'missing_api_key' }, 500);
  }

  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: 0.7,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      console.error('Groq upstream error', upstream.status, detail);
      return json({ error: 'upstream_error', status: upstream.status }, 502);
    }

    const data = await upstream.json();
    const message = data?.choices?.[0]?.message?.content?.trim();

    if (!message) {
      return json({ error: 'empty_response' }, 502);
    }

    return json({ message });
  } catch (err) {
    console.error('Handler error', err);
    return json({ error: 'internal_error' }, 500);
  }
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
