# Create a New HTML Page

Copy this prompt into an AI assistant and replace the placeholders with your own values.

---

I'm working on an Express.js project that serves static files from a `src/frontend/` directory. The project already has an example page at `src/frontend/index.html` and a reusable component pattern in `src/frontend/components/task-item.js`.

Here is the project's frontend structure:

```
src/frontend/
├── index.html          ← example page (use as reference)
├── components/         ← reusable UI components
│   └── task-item.js    ← example component (use as reference)
├── style.css           ← shared stylesheet
└── main.js             ← example JavaScript with fetch calls
```

The component pattern works like this: each component is a function that receives data and callbacks, builds DOM elements, and returns the finished element. The caller imports it and appends it wherever needed. See `src/frontend/components/task-item.js` for the full example.

Please create a new HTML page at `src/frontend/[your-page-name].html` and its companion `src/frontend/[your-page-name].js` for **[describe what the page does]**.

Rules:

- Keep the HTML page thin — structure and layout only. No inline scripts or styles.
- Use the same HTML structure as `src/frontend/index.html` (DOCTYPE, meta charset, viewport)
- Link to the shared stylesheet: `<link rel="stylesheet" href="style.css">`
- Link to the page JS: `<script type="module" src="[your-page-name].js" defer></script>`
- Use semantic HTML elements (`<section>`, `<form>`, `<ul>`, etc.)
- If any UI element is repeated or could be reused (list items, cards, form groups), extract it into a component in `src/frontend/components/` following the `task-item.js` pattern
- The page JS should import components and wire them up — not build all DOM elements inline
- Be beginner-readable with clear HTML comments explaining each section
