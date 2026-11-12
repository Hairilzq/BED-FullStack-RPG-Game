# Project Description - Tales of Varion
Hello there, this was once part of my Backend Development coursework where I had to develop a playable web browser game using my knowledge on CRUD endpoints, Databases, and Frontend usability with Backend functions. The project was split into two parts across two terms; First was creating the backend code only, using only a browser emulator like Bruno to play the game through submitting raw JSON payloads. Second was creating a frontend UI so that the game was playable in the browser, alongside other stuff like security features and additional game features. I have now converted this into a personal passion project to work on im my free time, adding new game features, optimizing code, securing endpoints, creating visuals, and anything I want to play with. I hope to look back at this project and see how much it has grown, much like how it did while I was first working on it.

# Tech Stack
* **Frontend:** Svelte, Vite, HTML5/CSS3
* **Backend:** Node.js, Express.js
* **Database & ORM:** SQLite / libSQL, Drizzle ORM
* **Authentication & Security:** JWT (HTTP-only cookie auth), bcrypt password hashing

# Game Theme Description
This is an RPG, turn-based, dynamic combat game with level progression. You somehow travel to an alternate universe where all of the lands are ruled by the Kingdom of Varion, under the tyrannical ruler Shaw Harion! Shaw holds the sacred weapon, the Blood Stone, that you suspect may take you back to your home world! As such, you set out to end the reign of terror of King Varion Shaw, and claim the Blood Stone so that you may go home!

Players may fight in 7 different levels that gradually increase in difficulty that introduce new game mechanics (such as Poison and Undead) in Battle. Players may earn gold from Battles to purchase cards or passives from the itemShop to increase their card selection choice in order to reliably counter more enemies or adopt different game strategies. Players may earn experience from Battles to level up their character, which grants them cosmetic titles based on their levelband. The goal of the game is to beat King Varion Shaw, reach the max level, and own all the cards/passives in the game!

# Notable Game Mechanics & System Architecture

* **Deterministic Action Timeline & Automated NPC Execution:**
  Powered by a server-side execution pipeline that queries database-defined movesets and hydrates them into a turn-based timeline. NPC logic processes independently without relying on client-side state, delivering automated, turn-driven combat resolution.

* **Multi-Entity State & Combat Lifecycle Management:**
  Maintains concurrent state tracking across multi-target encounters (up to 4 active dynamic NPCs alongside the player). Manages real-time HP deltas, target selection validation, and automated entity pruning upon defeat.

* **Entity-Bound Temporal Status Effect Engine:**
  Features an isolated state-tracking framework for per-entity dynamic status effects (DoTs like Burn, crowd control like Stuns). Handles duration decay, turn-start tick evaluation, and state cleanup automatically when effect durations expire.

* **Dynamic Relational Deck-Building & Profile Hydration:**
  Supports unconstrained player card-and-passive combinations. Upon battle initialization, the backend dynamically fetches, validates, and hydrates user-specific loadout configurations from the database into the active combat context.

* **Stateful Campaign Progression & Stage Provisioning:**
  Tracks player campaign progression milestones on the backend. Automatically calculates, provisions, and loads the appropriate level state and enemy wave configuration upon battle start without manual stage selection.

* **Dynamic Item Shop Hydration & Random Offer Selection**
  Randomly fills an item shop endpoint with a random selection of in-game content that is unowned by the user. Accepts a small shop roster refresh fee if a refresh is requested, and automatically removes and refills current shop roster items. Decides on the spot whether to provide a discount, and what band of discount (ranging from 15% off to 100% off)

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

Note that a JWT_SECRET variable is stored in a .env file (which is not in this repo) and its used for generating JWT tokens. Game images are also best imported for the best experience :)

Once done, to play the game, visit //http:localhost:5173 on your browser (while both servers are running). Youll see the login page. There are 3 preset users, choose any from the database or just make your own at Signup. Creating a new user creates for you a template loadout that you may change later on. Note that on db resets, newly created users will perish

Once you enter, you will see a navigation menu. Each menu visits its corresponding page:
 - GameCatalog
 - UpdateLoadout
 - Battle

Note you must be logged in and have a valid JWT token (which lasts for an hour) to navigate the game smoothly. Failure to do so will return errors for all pages.

View Game Description for what you can do in this game.

## Game Screenshots
The game screenshots consist of two folders; an OldGameScreenshots folder and a NewGameScreenshots folder:

### Old Screenshots (Version 1.0)
These are the game images available for viewing:
- GameCatalog page
- UpdateLoadout page
- BattleView page

### New Screenshots (Version 2.0)
These are the game images available for viewing:
- Login Page
- GameMenu page
- UpdateLoadout page
- GameCatalog page
- PlayerProfile page
- ItemShop page
- LevelSelection page
- BattleView page

## Additional Game Info
Refer to seed.js in /backend/src/db/seed.js for game content such as card names, enemy names, passive names, available levels. I may add a README document in the future to list all the game's content
