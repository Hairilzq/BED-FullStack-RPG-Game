# Changelog
All version updates and their associated changes are listed here (Versions are usually done per commit). Arranged from latest to oldest updates. Changes are either listed as `Added`, `Removed`, `Fixed`, or `Changed`. Versions are listed in this format x.y.z, where x is for major game changes/overhauls, y is for minor version upgrades and z is for small fixes/tweaks to a version.

## Version 1.1.1 - .gitignore Fix
- `Fixed`: Fixed `.env` and `local.db` from being committed despite being inside .gitignore

## Version 1.1 - Project Cleanup
### Project Structure
- `Removed`: Non-essential template files from the previous student template like Swagger, devcontainer and vitest have been removed for a cleaner, lighter commit

- `Removed`: Redundant function files like `error.test.js` have been removed as they serve no purpose to the game code

- `Removed`: Agent `.md` files (kiro folder) have been removed as they are not used

- `Removed`: Remnant template codes left within certain files like `index.js` have been cleaned slightly, leaving only essential server functions/directions

- `Changed`: `README.md` changed to talk about the game and relevant information only. Template directions for students have been removed

- `Added`: CHANGELOG.md added to track versions per commit

- `Added`: `.env` and `local.db` added to `.gitignore` as those are for local information only
### Frontend/UI
- `Changed`: Changed the BattleView UI to be cleaner and more organised; UI elements should not squeeze or overlap with eachother anymore, giving breathing room for each element

- `Changed`: Changed the 'Flee' button to say 'Continue' upon a win/loss

- `Fixed`: Players are now mandated to submit 2 action cards before executing their turn, previously allowed submitting at least 1 action card only

- `Added`: Menu now displays the player's current level by name, for ease of tracking

- `Added`: Add effects to entity UI cards whenever they take damage/heal/status effect applied/dodge attacks (player only)
### Backend/Game Changes
- `Fixed`: Patched a bug where players could progress to a 6th level upon winning the 5th level (which is the current max). Players now loopback to the 1st level upon completing the whole campaign of 5 levels

- `Fixed`: Patched a bug where not selecting targets causes players to 'skip' their turn due to invalid/non-existent target. Server now auto-resolves empty targets to alive enemies automatically. Helps with non-offensive moves where a target is still required but a player may not have selected one

## Version 1.0
Final project commit made on August 14th 2026
