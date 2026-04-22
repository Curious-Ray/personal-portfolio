# Deepak Thapa — Portfolio

Personal portfolio site for [Deepak Thapa](https://www.linkedin.com/in/deepak-thapa-5464b6304/), an independent developer based in Kathmandu, Nepal.

This is a work in progress — content and projects are being added incrementally.

## Stack

- Static HTML / CSS / JavaScript (no build step)
- [GSAP](https://gsap.com/) + ScrollTrigger — animations
- [Lenis](https://github.com/studio-freight/lenis) — smooth scroll
- [Groq API](https://groq.com/) — chat backend, via Vercel serverless function

## Project structure

```
.
├── index.html          # main portfolio page
├── ai.html             # structured profile (for AI crawlers)
├── style.css           # all styles
├── main.js             # animations + chat UI
├── api/
│   └── chat.js         # Vercel Edge function for the chat backend
└── assets/
    ├── images/
    └── video/
```

## Local development

```bash
python -m http.server 5173
# then visit http://127.0.0.1:5173/
```

The chat widget UI works locally, but the AI responses require the `/api/chat` endpoint, which only runs when deployed to Vercel.

## Deployment

Designed for [Vercel](https://vercel.com/). Connect this repo, then add an environment variable:

```
GROQ_API_KEY = <your Groq API key>
```

The serverless function in `api/chat.js` reads the key at runtime — it never touches the client.

## Contact

- Email: [thapadeepak726@gmail.com](mailto:thapadeepak726@gmail.com)
- LinkedIn: [deepak-thapa-5464b6304](https://www.linkedin.com/in/deepak-thapa-5464b6304/)
- GitHub: [Curious-Ray](https://github.com/Curious-Ray)
