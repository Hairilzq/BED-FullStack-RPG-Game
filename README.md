(Same READ.ME used for the school assignment, with some content added to update to the current context)
# Tech Stack
* **Frontend:** Svelte, Vite, HTML5/CSS3
* **Backend:** Node.js, Express.js
* **Database & ORM:** SQLite / libSQL, Drizzle ORM
* **Authentication & Security:** JWT (HTTP-only cookie auth), bcrypt password hashing

# Student Assignment Template
Express.js + libsql + Drizzle ORM starter for building your own API and frontend feature.

This template now starts without any sample MVC feature routes. Only infrastructure endpoints are pre-wired:

- `GET /api/health`
- `GET /api-docs`

# Game Theme Description
This is an RPG, turn-based, dynamic combat game with level progression. You somehow travel to an alternate universe where all of the lands are ruled by the Kingdom of Varion, under the tyrannical ruler Shaw Harion! Shaw holds the sacred weapon, the Blood Stone, that you suspect may take you back to your home world! As such, you set out to end the reign of terror of King Varion Shaw, and claim the Blood Stone so that you may go home!

Players can view game data through the 'Game Catalog' where they may read more about the cards, passives, enemies, lore, and levels available. Players can create their own customised deck of action cards and choice of passive based of the available selection of 13 cards and 6 passives through the 'Update Loadout'. Players can then start battles by selecting 'Battle', and progress through the 5 preset levels in the game where they fight progressively harder enemies up until the boss, King Varion Shaw (and company).

# Notable Game Mechanics & System Architecture

* **Deterministic Action Timeline & Automated NPC Execution**  
  Powered by a server-side execution pipeline that queries database-defined movesets and hydrates them into a turn-based timeline. NPC logic processes independently without relying on client-side state, delivering automated, turn-driven combat resolution.

* **Multi-Entity State & Combat Lifecycle Management**  
  Maintains concurrent state tracking across multi-target encounters (up to 4 active dynamic NPCs alongside the player). Manages real-time HP deltas, target selection validation, and automated entity pruning upon defeat.

* **Entity-Bound Temporal Status Effect Engine**  
  Features an isolated state-tracking framework for per-entity dynamic status effects (DoTs like Burn, crowd control like Stuns). Handles duration decay, turn-start tick evaluation, and state cleanup automatically when effect durations expire.

* **Dynamic Relational Deck-Building & Profile Hydration**  
  Supports unconstrained player card-and-passive combinations. Upon battle initialization, the backend dynamically fetches, validates, and hydrates user-specific loadout configurations from the database into the active combat context.

* **Stateful Campaign Progression & Stage Provisioning**  
  Tracks player campaign progression milestones on the backend. Automatically calculates, provisions, and loads the appropriate level state and enemy wave configuration upon battle start without manual stage selection.

# Setup
git clone "..." -> Clone the code repo by inserting the repo link in "..."

Once done, there are two servers you need to setup. First, do 'cd backend' and type these into the terminal:
```bash
npm install
npm run db
npm run dev
```
Second, do 'cd frontend' and type these into the terminal:
```bash
npm install
npm run dev
```
Ensure that both servers are running. Ensure that there are no reference errors (this file is in another directory that this file needs). If any of the files are missing, the game may not start.

Note that a JWT_SECRET variable is stored in a .env file (which is not in this repo).

Once done, to play the game, visit //http:localhost:5173 on your browser (while both servers are running). Youll see the login page. There are 3 preset users, choose any from the database or just make your own at Signup. Creating a new user creates for you a template loadout that you may change later on

Once you enter, you will see a navigation menu. Each menu visits its corresponding page:
 - GameCatalog
 - UpdateLoadout
 - Battle

Note you must be logged in and have a valid JWT token (which lasts for an hour) to navigate the game smoothly. Failure to do so will return errors for all pages.

View Game Description for what you can do in this game.

# Assumptions
The game only supports one user at a time, and that user must have a valid token to properly navigate the game. Thanks to Svelte, there is no way for the user to enter the main game without a token (aka logging in), but if the token expires (after 1h) while the user is in the main game, this may cause issues (frontend returns error for every function the user tries). New users created at sign up presist even after the server stops but will be deleted when a database reset is done.

The game has many edge cases interactions that may not crash the server but cause some 'illegal' interactions. Such interactions include using certain abilities twice when they are not supposed to and not selecting a target and hence missing their turn. These are not 'patched' because they are easily avoidable and the cost to foolproof these interactions are not worth it. If it doesn't deter gameplay, it can be ignored.

Some cases where a game may not work as intended are leaving a battle without 'fleeing' or logging in as another user while not finishing a battle. The server is built to only support hosting one battle at a time, hence if a battle is active but wasnt closed properly, the player may not start another battle. This requires the manual reset of a battle (http://localhost:3000/battle/reset) or simply resetting the database. These cases are hard to fix as it requires knowing when a user is no longer present which is not feasible.

Lastly, deprecated routes have been removed, but their persisting model codes may still remain. Removing them will be incredibly hard as some model codes are used multiple times across many routes. So, they are untouched

If the frontend console bugs you for some 'changes', ignore them. These are due to the way Gemini coded the frontend using some deprecated functions and such. The main function of the frontend still works.

## Build Your Feature
1. Add tables in `src/db/schema.js`
2. Add seed data in `src/db/seed.js`
3. Create model files in `src/models/`
4. Create controller files in `src/controllers/`
5. Create route files in `src/routes/`
6. Register routes in `index.js` before `app.use(errorHandler)`
7. Build/update pages in `src/frontend/`

## Key Files
| File | Purpose |
|---|---|
| `index.js` | App setup, middleware, route registration, global error handler |
| `src/db/schema.js` | Drizzle table schemas |
| `src/db/seed.js` | Database reset and seed script |
| `src/models/` | Data access layer |
| `src/controllers/` | Request validation and response formatting |
| `src/routes/` | Route to controller mapping |
| `src/utils/_errors.js` | `AppError`, `ERROR_CODES`, and `errorHandler` |
| `_extras/tests/` | Infrastructure and baseline tests |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with auto-reload |
| `npm run db` | Recreate DB and seed data |
| `npm test` | Run test suite |
| `npm run export` | Export project zip (without node_modules) |

## Game Screenshots
The game screenshots consist of the following interfaces:
 - GameCatalog
 - UpdateLoadout
 - Battle
