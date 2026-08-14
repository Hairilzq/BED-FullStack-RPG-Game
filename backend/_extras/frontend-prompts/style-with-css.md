# Style a Page with CSS

Copy this prompt into an AI assistant and replace the placeholders with your own values.

---

I'm working on an Express.js project with a shared stylesheet at `src/frontend/style.css`. The existing styles use a clean, minimal design with white card sections on a light grey background.

Here is a summary of the existing design in `src/frontend/style.css`:

- Base font: Arial/Helvetica, line-height 1.6, color #333
- Background: #f5f5f5, content max-width 600px centered
- Sections: white background, 8px border-radius, subtle box-shadow
- Primary accent color: #4a90d9 (buttons, focus states)
- Success color: #5cb85c, danger color: #d9534f

Please add CSS rules to `src/frontend/style.css` for **[describe what you want to style]**.

The new styles should:

- Match the existing design (colors, spacing, border-radius, font sizes)
- Use the same naming conventions (e.g., `#section-name`, `.class-name`)
- Be added at the bottom of the file under a new comment section header like:
  ```css
  /* ===========================
     [Your Section Name]
     =========================== */
  ```
- Keep selectors simple and readable for beginners
- Use the existing accent colors rather than introducing new ones
