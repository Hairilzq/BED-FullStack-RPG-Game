# Handle DOM Events

Copy this prompt into an AI assistant and replace the placeholders with your own values.

---

I'm working on an Express.js project with a plain HTML/JS frontend. The existing file `src/frontend/main.js` demonstrates two event handling patterns:

1. **Direct event listener** on a form:
   ```javascript
   taskForm.addEventListener('submit', async (event) => {
     event.preventDefault();
     // handle form submission
   });
   ```

2. **Event delegation** on a parent container (so dynamically added buttons work):
   ```javascript
   taskList.addEventListener('click', async (event) => {
     const target = event.target;
     if (target.classList.contains('toggle-btn')) {
       // handle toggle button click
     }
     if (target.classList.contains('delete-btn')) {
       // handle delete button click
     }
   });
   ```

Please add event handling to `src/frontend/[your-page-name].js` for **[describe the interactions you need]**.

The event handling should:

- Use `addEventListener` (not inline `onclick` attributes)
- Use `async` callbacks when the handler needs to call the API
- Use `event.preventDefault()` on form submissions
- Use **event delegation** on a parent element for buttons inside dynamically rendered lists (attach one listener to the `<ul>` or container, then check `event.target` class names)
- Store item data in `data-*` attributes on buttons (e.g., `dataset.id`) so the handler knows which item to act on
- Wrap API calls in `try/catch` and show errors to the user
- Re-render the list after successful create, update, or delete operations
- Keep the code beginner-readable with comments explaining each listener
