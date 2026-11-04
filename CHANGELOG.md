# Changelog
All version updates and their associated changes are listed here (Versions are usually done per commit). Arranged from latest to oldest updates. Changes are either listed as `Added`, `Removed`, `Fixed`, or `Changed`. Versions are listed in this format x.y.z, where x is for major game changes/overhauls, y is for minor version upgrades and z is for small fixes/tweaks to a version.

## Version 1.2 - Game Content Update
Major Game Content Update meant to bring new life to this game by introducing new mechanics and combat features, new cards and passives, revitalizing older game content, new enemy designs, levels, and lore! Meant to be a stepping stone to the next major game update
### New Features
- `Added`: New 'Intelligence' mechanic. Players now have a set amount of chance to perform a 'Critical Hit' which doubles their total damage (includes passive buffs) and ignores defense, based on their intelligence

- `Added`: New 'Undead' and 'Revive' mechanic. Enemies with the 'Undead' trait may revive upon death when 3 turns have elapsed after their death and that the current battle hasn't ended. The 'Revive' status is granted to 'Undead' enemies when the player kills them, and ticks down like regular status effects, till its activation after 3 turns, where 'Undead' enemies will revive with their original health and defense!

- `Added`: New 'Curse' mechanic. Enemies can inflict 'Curse' onto players, preventing them from using any positive status effects on themselves! Can be cleansed with 'Fine Feeling', the only card immune to this effect

- `Added`: New 'Poison' mechanic. Enemies can inflict 'Poison' onto players, dealing 1 damage over 5 turns

- `Fixed`: Fixed a bug where players can 'stack' status effects that span over a duration of time (e.g using 'Be Vigilant' twice will grant two separate instances of the 'RegenAgility effect, which can amount to a lot of stat buffs over time). Now, using a card that grants a long-lasting status effect (3 or more turns) will add one more turn duration to it. This can stack multiple times a turn (e.g using 'Be Vigilant' twice in a turn will add 2 more turn duration to the existing effect). This change applies to 'Be Vigilant', 'Mind Games', 'Angry Feeling' and 'Marked (effect)' only. Ill get to applying this fix to special case cards like 'Brace' that rely on a similar mechanic but are handles differently.

- `Changed`: Player agility now starts at 50/100 instead of 100/100, which removes the possibility of always dodging the first enemy attack. Player agility may rise past their starting agility level, and still caps out at 100. Change added to accomodate for new Intelligence mechanic which offsets the balance

- `Changed`: Player level progress is no longer set back to level 1 upon a loss

### Card and Passive Content
- `Added`: New weapon (card); 'Crossbow Shot'! A ranged weapon that deals 10 damage on hit, requires 'Loading' the weapon once by using the 'Crossbow Shot' card. Grants the 'Loaded' effect that lasts for 3 turns (starts counting after activation). Using another 'Crossbow Shot' card activates this 'Loaded' effect, and fires the weapon!

- `Added`: New weapon (card); 'Dance Blades'! A melee weapon that deals 3 damage on hit, and has the chance to hit the same enemy again! Achieve the possibility to multiply your damage output up to 5 times!

- `Added`: New weapon (card); 'Javelin Toss'! A ranged weapon that deals a measly 4 damage, but has an increased 'Critical Hit' chance (currently at 50% more), hence allowing it to double its damage and ignoring defenses more frequently, eleviating its weakness!

- `Added`: New weapon (card); 'Great Hammer'! A melee weapon that deals 8 damage on hit, and 4 damage to adjacent targets! Requires 'Prepping' the weapon once (similar mechanic to 'Crossbow shot')

- `Changed`: Reworked 'Sword Slash', giving it a new ability; 'Shield Breaker'! 'Sword Slash' now deals 3 extra damage to enemies with a defense on them, allowing 'Sword Slash' to even out its damage on defense-heavy enemies, or hit harder on defense-light enemies!

- `Changed`: Reworked 'Slingshot', giving it a new ability; 'Marked'! 'Slingshot' now applies a 'Marked' effect on targetted enemies, allowing that enemy to receive 2 extra damage from its attacks!

- `Changed`: Reworked 'Boulder Hurl', reducing its damage on hit from 4 -> 3, but dealing 2 damage to adjacent targets!

- `Added`: New card; 'Be Vigilant'. Works in similar fashion to 'Energize', but regenerates agility over 4 turns rather than in one shot

- `Added`: New card; 'Smart Tactics'. Grants 10 intelligence points to the player on activation

- `Added`: New card; 'Mind Games'. Works in similar fashion to 'Smart Tactics', but regenerates intelligence over 3 turns rather than in one shot

- `Added`: New card; 'Angry Feeling' (a play on words similar to 'Fine Feeling'). Grants an additional 1 damage per-hit on any damaging moves for 3 turns, but consumes 5 health (at a high level overview, this equates to 5 health for 5 extra damage)

- `Changed`: Reworked 'Fine Feeling', now cleanses active statuses on the player that are negative (like 'Burn')

- `Changed`: Reworked 'Brace', now heals 10 health points in the downtime turn, to offset losing a turn

- `Changed`: Nerfed 'Energize' to recover only 10 agility points instead of 20

- `Added`: New passive; 'Astute'. Passively recover 3 intelligence points a turn but lose 5 health points

### Enemy and Level Content
- `Added`: Added a new enemy, 'Wishful Moth'! A Flying enemy that can inflict the new 'Poison' effect onto players

- `Added`: Added a new enemy, 'Mushroom Moore'! A mushroom brought to life by Witches, inflicts the new 'Curse' effect onto players

- `Added`: Added a new enemy, 'Fungi Beast'! A Giant Hulking beast made out of Fungi, roams the 'Fungi Feugal' area. Mini boss with 30 health points and 1 defense point, capable of healing and dealing high damage from its ranged attack! On its last move, has a chance to do a devastating Critical Blow!

- `Changed`: Added a new move for 'Goblin Brute' called 'Jab' which is his 2nd move out of a now 3-move cycle. Given to make him more of a threat since he dealt no damage at all

- `Added`: Added a new level, 'Twilight Forest'! Comes after 'Goblin Hideout' and before 'Undead Crypt', features the new enemies 'Wishful Moth' and 'Mushroom Moore'

- `Added`: Added a new level, 'Fungi Feugal'! Features the newest Mini boss, 'Fungi Beast' alongside 'Mushroom Moore'(s) and a 'Goblin' (filler enemy)

- `Changed`: Removed 'Exalted Mage' from 'Undead Crypt', replaced with 'Wishful Moth' instead to make that level easier

- `Changed`: Removed 'Skeleton Warrior' from 'Castle Courtyard', replaced with 'Mushroom Moore' instead to reduce damage output from enemies whilst adding combat complexity

### Code Aesthetics and README changes
- `Added`: Added `#region` markers (applicable to Visual Studio Code IDE) to `battlesController.js` and `battleModel.js` to semantically markout sections of the code, and to allow the collapsing of sections for better readability

- `Changed`: Updated README to reflect new updated information

- `Fixed`: Fixed an error where the README contains duplicate information, such as repeating whole paragraphs. This may have been caused by a merging error on my end

## Version 1.1.2 - Combat Engine Rework
- `Changed`: Reworked the Combat engine (in battlesController.js) to use a local 'snapshot' of the enemy's activeBattleTable, rather than performing frequent database I/O requests. Slightly improves combat processing. Main reason was to have an easier time tracking alive enemies during combat for future 'AOE' moves

- `Removed`: Auditted battlesController.js to remove old commented out code to make it look cleaner/easier to read

- `Removed`: Removed the try-catch code lines in battlesController.js for fightBattle function (previously commented out). Change made to make it easier to debug the combat engine

- `Added`: Added .gitignore to project root because I added a TODO.md for my personal use

Small write-up: In the next version patch, I will be adding new content to the game. This will include some new, experimental features that may require combat engine code rewrites (like this patch). I plan to simueltaneously audit the combat engine once more to make it more efficient/clean. Combat engine code will always be changing in future patches

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
