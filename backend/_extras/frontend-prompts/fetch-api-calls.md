# Make Fetch API Calls

Copy this prompt into an AI assistant and replace the placeholders with your own values.

---

I'm working on an Express.js project where the backend serves a REST API. The existing file `src/frontend/main.js` demonstrates how to make API calls using `async/await` with `fetch()`.

The API follows this URL pattern: `/api/[resource-name]`

Here is the pattern used in `src/frontend/main.js`:

```javascript
const API_URL = '/api/tasks';

const fetchTasks = async () => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  return response.json();
};
```

Please create a new JavaScript file at `src/frontend/[your-page-name].js` that makes fetch calls to `/api/[your-endpoint]`.

The file should include:

- A constant for the API base URL: `const API_URL = '/api/[your-endpoint]';`
- An async arrow function to **GET all** items: `const fetchAllItems = async () => { ... };`
- An async arrow function to **POST** a new item: `const createItem = async (data) => { ... };`
- An async arrow function to **PUT** (update) an item: `const updateItem = async (id, data) => { ... };`
- An async arrow function to **DELETE** an item: `const deleteItem = async (id) => { ... };`
- Each function should use `async/await` (not `.then()` chains)
- Each function should check `response.ok` and throw an error if the request fails
- POST and PUT requests should set `headers: { 'Content-Type': 'application/json' }` and use `JSON.stringify()` for the body
- Include JSDoc comments above each function
- Keep the code beginner-readable
