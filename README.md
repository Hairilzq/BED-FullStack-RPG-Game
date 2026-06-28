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

To play, here is what to do:
1. If you want to change your loadout, use PUT '../users/loadout' to change your loadout. Must enter valid user and password as a query. Format goes like this:
{
  "card_1": cardName
  ... (do this for 5 card instances)
  "passiveName": passiveName
}
Cards and passives must be valid and are known in the database. If there is an ongoing battle, this will fail

2. Start a battle if there isn't any. Use POST '../battle/initiate' to start a battle. Format goes:
{
  "playerName": playerName
  "enemyName": enemyName
}
Player and enemy names must be valid. If there is an ongoing battle, this will fail

3. To fight in an active battle, use PUT '../battle/fight' to fight. Format goes:
{
  "card_1": cardName,
  "card_2": cardName
}
Card names must be valid and in the fighting player's loadout. Submit to progress the battle. Pay attention, you may accidentally submit twice and unknowingly progress the battle. If there is no ongoing battle, this will fail

4. To reset an active fight, use DELETE '../battle/reset'. This deletes whatever active battle is going on. If there is no active battle, this will fail.

5. Some other non-important actions:
  - You can update your username and password using PUT '../users/update'. Must provide a valid username and password as a query. Format goes:
  {
    "newUsername": username,
    "newPassword": password
  }
  This updates the username across the board (e.g playerStats, playerLoadout);
  - You can view cards, passives, and enemies. All of these are GET methods.
  - For cards, GET '../users/showCards'
  - For passives, GET '../users/showPassives'
  - For enemies, GET '../users/showEnemies'
  - For a specific card, GET '../users/showCard/:id' where id is the card Id number. Must be an integer

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
