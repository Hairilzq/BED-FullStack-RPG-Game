# Student Assignment Template

Express.js + libsql + Drizzle ORM starter for building your own API and frontend feature.

This template now starts without any sample MVC feature routes. Only infrastructure endpoints are pre-wired:

- `GET /api/health`
- `GET /api-docs`

# Game Theme Description

This is an RPG, turn-based, dynamic combat game with FOCUS on combat. You somehow travel to an alternate universe where all the lands are ruled by the Kingdom of Varion, under the mighty ruler Shaw Harion! Shaw holds the sacred weapon, the Blood Stone, that you suspect may take you back to your world! As such, you set out to end the reign of terror of King Varion Shaw, and claim the Blood Stone so that you may go home!

(Because the game is focused on combat, there are no set levels for the player to do. However, they may fight progressively harder enemies till they reach the mighty King Varion Shaw!)

## Setup

git clone "..." -> Clone the code repo by inserting the repo link in "..."
```bash
npm install
npm run db
npm run dev
```
'install' installs dependencies, 'run db' loads the database, and 'run dev' starts the server

# Assumptions

While the game has basic input validation guards, it is not made to be foolproof and hence also relies on the player's own descretion (e.g, certain moves like 'Brace' shouldnt be used twice, but the game allows it anyway). There is also no single 'play' route and that if a player wants to setup any battles, they need to know the correct steps to do so. This will be explained in the interview. The game is mostly focused on combat and does not take into account user convenience

Open http://localhost:3000 after the server starts.

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
