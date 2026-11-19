# Changelog
All version updates and their associated changes are listed here (Versions are usually done per commit). Arranged from latest to oldest updates. Changes are either listed as `Added`, `Removed`, `Fixed`, or `Changed`. Versions are listed in this format x.y.z, where x is for major game changes/overhauls, y is for minor version upgrades and z is for small fixes/tweaks to a version.

## Version 2.1 - Battle Event Sequencer and a Gamified UI
Following the major frontend changes in the previous version, this new version brings a new way to feel and experience battles, making it feel like a proper game! Accompanying it are some minor changes to passives and some bug fixes.

### Battle Event Sequencer
- `Added`: Added a Battle Event Sequencer to the frontend! Previously, battle state after each turn will be updated in a single go; All battle log messages are pushed immediately, entity stats are morphed without clear intent, and status effects are spawned in instantly. This gave the player a lot of information to process at a time, which can be frustrating. Now, the frontend will queue the 'events' that happened in a turn into a 'sequencer' which plays the events out one by one, showing the entities involved by highlighting their UI cards, and what changed such as stat changes or status effects being spawned in. A 1.5 second delay is given between each event so that the player can process each event one at a time. With this change, it is much easier for the player to know what happened, and feels more like an interactive game!

### BattleView UI Upgrades and Changes
- `Added`: Added enemy portrait art to BattleView! Enemies are now displayed using their own custom image art (it is only fair that the enemies get some, since the cards/passives do!), which gives a clearer picture of what enemy the player is facing, and makes the battle feel more real!

- `Added`: Added floating numbers/messages/effects to BattleView! Whenever an entity takes damage, heals, or applies defense/removes defense, a floating popup will jump out, which gives a clearer picture of what happened. This applies to status effects applied to an entity. Other special effects like "DODGED!" or "BLOCKED!" are spawned in as well.

- `Added`: Added custom cursors to BattleView! The cursor during battle defaults to using a 'Thinking' cursor, then uses a 'Target' cursor when hovering over entity UI cards, then lastly a 'Disabled' cursor used during playback animations (which is also used elsewhere in the game's UI)

- `Changed`: Changed how health is displayed on the enemy/player UI card. Enemy/player UI cards now use a 'health bar' display which gives a clearer view of how much health an enemy has. Retains the numeric display for clarity, and shows the max health of an enemy/player!

- `Changed`: Changed how defense is displayed on the enemy (only for now) UI card. Enemies with a defense stat more than 0 will have a blue shield icon/badge displayed at the bottom right of the card, with a numeric value for how much defense said enemy has. This icon/badge will disappear the moment it goes below 0, dynamically coming/going depending on the enemy's current defense. This makes it easier to tell if an enemy has defense!

- `Changed`: Changed how the player's passive is displayed in BattleView. Previously, it used a string tag to show the player what passive they have on. Now, uses the passive's image art which is placed at the top righthand corner of the player's UI card. It looks much cleaner this way, removing the need for strings!

- `Changed`: Changed how status effects are displayed/rendered to BattleView. Rather than using string tags for status effects active on an entity, the frontend now uses new 'status effect icon art' that is spawned in the top bar section of each entity! These icons are much easier to read and tell what the status effect is, and it does not pollute the entity UI cards!

- `Changed`: Changed how enemy trait are displayed to BattleView. Rather than using string tags to indicate an enemy trait, the frontend now uses new 'trait icon art' that is placed on the right side of each enemy! These icons are much easier to read and tell what traits the enemy has (especially if that enemy has multiple traits) and it does not pollute the enemy UI cards, giving more breathing room to the UI card!

- `Changed`: Changed the BattleView to use custom icon art for representing stat fields (and other relevant stuff) instead of emojis

- `Changed`: Updated the GameScreenshots folder to use the new look of BattleView

### General UI changes
- `Changed`: Changed how the Battle stats in the GameMenu are represented. Rather than using text strings to indicate 'health' or 'agility', it uses custom game icon art to represent the respective stats

- `Changed`: Changed how 'gold' and 'experience' are shown throughout the game. Much like the shop, the game now represents gold using the game's 'Gold' icon, same for 'experience'. This change can be seen in the upper tab bar, the PlayerProfile page, and in the GameCatalog (for enemy drops)

- `Changed`: Changed the enemy catalog in GameCatalog to show enemy portraits instead, then features a side panel (much like cards catalog and passives catalog) that features the enemies details, which includes using the new trait icons for showing enemy traits, and the gold/exp icons to show gold/exp drops.

### Passive Changes
- `Changes`: Changed how Passive data is registered within the game. Previously, stat buffs/debuffs from passives were only accounted for during Battle; it did not affect the basePlayerStats elsewhere. Now, upon updating your loadout or creating a new user, the server automatically pushes your new morphed stats based on your passives. This is reflected within the GameMenu in the 'Battle Stats' field.

- `Changed`: Reworked the 'Rejuvenate' passive; Now heals 2 health points per turn, in a similar fashion to Steadfast and Astute, rather than healing a health point per card played. This means that the player will always heal 2 health points per turn regardless of whether they were stunned or played any cards that turn

- `Changed`: Buffed 'Astute' to recover 5 intelligence point per turn instead of 3

### Balance Changes
- `Changed`: Nerfed Brace to recover 5 health points instead of 10 during downtime turn

### Bug Fixes
- `Fixed`: Fixed a bug where enemies with the 'AffectAll' ability attached to their move would apply the player's own status effect on enemies rather than their own. This comes from a reference bug where I used a variable also used by the player without clearing it. Now it uses a direct referrence to the applied status

- `Fixed`: Fixed a bug where enemies who raise or lower their defence using a status effect do not return to their base defense on the next turn, resulting in their defense either staying down (for enemies who lower their defense) or their defense constantly going up (for enemies who raise their defense). A new base stat reset is added at the start of each turn being processed so now their defense reflects accurately on the frontend and in the backend

- `Fixed`: Fixed a bug where applying the 'Marked' effect on a single enemy now causes the player to deal 2 additional damage to all enemies. This was due to bad coding practices on my end. Now the server checks if the target enemy is marked, then evaluates the additional damage. 'Marked' effect is also not exclusive to the Slingshot and can be leveraged by all Offensive cards (allowing synergy)

- `Fixed`: Fixed a bug where Cleansing/Removing the 'Curse' effect on the player whilst playing a card that inflicts a positive status effect on the player will not come through (as the server still thinks the player is 'Cursed'). Cleanse now automatically flicks the boolean that states that the player is 'Cursed', allowing for Cleansing and applying a stauts effect in the same turn

- `Fixed`: Fixed an error where new players cannot sign up; this was due to an inventory insertion error where the server expects additional data, but the wasnt provided with such (from the addition of itemType field in userInventory)

- `Fixed`: Fixed a visual bug where status effects that have expired are still displayed on the frontend. This is due to how the server tracks expired status effects; status effects that have elapsed their duration (statusDuration = 0) will still be carried by the server, but removed next turn, though their effect will not persist while expired. Now, status effects with a statusDuration of 0 will be removed by the server and not carried forward

- `Fixed`: Fixed a visual bug where the target indicator for cards played on enemies do not render. This is due to a Svelte issue where an entity UI card that is not explicitly updated by server input will not inccur this change...something like that. Now, target indicators are visible on enemy UI cards when a card is directed at them

## Version 2.0 - Adventurous New Interface and Player Profiles
Major Game UI overhaul, completely revitalizing the style and feel of the game. New style and vibe, animated buttons and displays, cleaner displays, new game art, and enhanced quality of life features. Accompanying this new interface comes the addition of Player profiles, inventories, and a mock shop. Players now posses gold and user levels to flex accounts, own cards/passives rather than accessing everything, and can purchase cards/passives with their gold, adding towards game progression!

### New Features
- `Added`: Added an inventory system to users/players! Users must now own cards/passives available in the game before they can use them in their loadouts. To get new cards, player's must purchase them in the 'mock shop' (see below for more info). Owned cards are reflected into their profiles in their inventory!

- `Added`: Added user currency; gold! Players may now earn gold from battles, which are dictated by the enemies present. Certain enemies drop more gold than others, usually based on their difficulty. Goblin enemies are the exception, and drop more gold than their usual counterparts! Gold serves as the current main currency to purchase cards/passive items!

- `Added`: Added a user leveling system! Not to be confused with playable levels, user levels are (for now) cosmetic data that a player can flaunt in their profiles! User levels are increased by experience dropped from enemies, with harder enemies dropping more experience. After reaching a certain threshold, users will level up, and have their new levels reflected in the game! Currently, there are only 10 user levels to climb. Accompanying these levels are level titles earned at certain level milestones, which are also reflected in the game!

- `Added`: Added a mock shop! The mock shop features 4 purchasable cards unowned by the player, curated from the Shop Roster, randomly populated by the server! Players can 'refresh' the Shop Roster to feature a new set of purchasable cards, and cards on sale may randomly go on sale, from 15% off to 100% off (free!). Purchased cards are placed into the player's inventory, and will not shop up in the shop anymore. The shop feature now introduces a whole new lifecycle to the game, adding more game progression and gameplay loop to make the game feel more complete!

- `Changed`: Removed the 'Utility' card type from the game, replaced with two distinct new card types; 'Assistive' and 'Distruptive'! Old cards that had 'Utility' labels are now changed to either of these two types. The new names match the '-ive' word form that the current types use. Assistive cards have direct effect on the player by applying buffs to their character, while Distruptive cards have indirect effect on the player by applying debuffs to the enemies instead!

- `Added`: Added a 'NewGameScreenshots' folder to 'GameScreenshots' (also forgot to explicitly declare a 'GameScreenshots' folder in the changelog. 'GameScreenshots' now hold two folders; 'OldGameScreenshots' which holds the former frontend look of the game before the UI overhaul (these are as old as Version 1.0), and 'NewGameScreenshots' which holds the new look of the game (and new pages) after the overhaul

### Frontend UI Updates
Added a new set of pages, reworked the game's theme and look, as well as changing how older pages look. The changes affect all the game's pages, so they will be distinctly categorised below:

#### Overall Game Theme/Look
- `Changed`: Revitalized the Game's look from the former Frontend UI mockup (used as the final look for the project upon CA2 Submission) to the new 8-bit, Pixel style! Mimics classic retro game vibes. Style to be changed/upgraded in the future

- `Added`: Added smooth page transitions. Rather than instantly populating the page to view, there is a subtle 'fade-in' transition between pages. Makes the game feel less static and flow better between pages (and on page loading)

- `Added`: Added card art (Images)! Game items (primarily cards/passives for now) now use image cart to represent them rather than the text cards previously used (refer to Game_Screenshots/OldGameScreenshots for example). Card art gives a more lively and vibrant feel to the game, and make it (somewhat) easier to tell cards apart. All card art uses the same 8-bit, abstract, primary colour style which matches the game's theme. All newly added cards/passives will also have card art implemented

- `Added`: Added button animations. Buttons now lift up slightly when hovered, and has a 'pressing' animation when clicked. Buttons light up slightly when hovered

#### Login Page
- `Added`: Added the Game's Title, **Tales of Varion**, to the login page, which occupies most of the lefthand to middle of the screen. Moved the login window to the right slightly to accomodate this

#### Game Menu/Home
- `Added`: Added a navigation tab at the top of the screen; navigation tab holds the options to navigate to other pages, current page option is lit up in the tab bar. On the lefthand side, the game's title as the home button. On the right, basic user data such as username, gold, level, and experience

- `Added`: Added the user's current loadout to the Homescreen. Users now can view their current active loadout without needing to change it to be sure. An 'Edit' button was added in the same container to make it convenient to edit the loadout instantly

- `Added`: Added the player's stats to the Homescreen

- `Added`: Added in-game 'tips' (referred to as 'Field Notes') to the Homescreen. The tips dynamically slide on their own, though users can scroll through the tips manually

#### Game Catalog
- `Removed`: Removed the 'levels' tab/view from GameCatalog, this has been moved to the new 'Level Selection' page

- `Changed`: Changed how 'Cards' are presented into GameCatalog. Now, the GameCatalog presents the 'Cards' as their image art (refer to GameScreenshot), and a small panel on the side would present the
relevant data fields, such as cardName, cardDesc, and cardType. Made the catalog container scrollable so that users need not scroll the page down so far. Unowned cards are greyed out and have a 'locked' text over it, its item details displays 'You have not unlocked this card yet'

- `Changed`: Changed how 'Passives' are presented into GameCatalog. Now, the GameCatalog presents the 'Passives' as their image art, and a small panel on the side would present the relevant data fields, such as passiveName and passiveDesc. Made the catalog scrollable. Unowned passives are greyed out and have a 'locked' text over it, its item details displays 'You have not unlocked this passive yet'

- `Changed`: Changed how 'Enemies' are presented into GameCatalog. Now, the GameCatalog presents the enemy data by showing only its enemyName, enemyDesc, relevant traits (e.g flying, undead), and the gold/experience they drop. Enemy image art will be rolled out in the next major update

#### UpdateLoadout
- `Changed`: Changed how the 'Cards' and 'Passives' are presented in 'UpdateLoadout'. Cards/Passives use their image art inside the selection container. Cards are also presented side by side (2 cards a row) to accomodate the great number of cards

- `Changed`: Changed how the item details are presented in 'UpdateLoadout'. Item details now includes the card/passive image art below its name, and shows its type if any (not applicable to passives). Item detail only present the cards description below the image art

- `Added`: Added a small 'pop-up' animation when cards/passives are added into the 'Proposed Loadout' view

#### Battle View
- `Changed`: Changed the way cards are played in a battle. Cards are now 'draggable' in the player's hand, and players can drag the intended card to play to the enemy target of choice. Cards can be dragged to the player's own UI card if the player wants to play a card on themselves (for Supportive/Defensive/Assistive cards) or when they want the card to auto-target the first in-line enemy. An orange indicator (either 1 or 2) will pop up beside the targetted entity's UI card to indicate that an action has been queued on that target. Queued actions cannot be reversed

- `Removed`: Remove the clunky 'Payload Summary' UI at the bottom of the screen as it is not needed and takes up space

#### NEW: Player Profile
- `Added`: Added a new 'Player Profile' page! This page is meant to present all of the user's data to the user. This includes their level, their level title (above their level number), the amount of experience to the next level, their gold, their highest playable level achieved (presented as the level's name and the level number), and their inventory that holds their owned Cards/Passives. Inventory allows filtering for Cards or Passives, and a search bar to search for a certain card. Cards/Passives are presented as their image art. The cards populate the screen by 'filling up' the inventory container. Beside the cards/passives, an item details panel similar to that in GameCatalog

#### NEW: Level Selection
- `Added`: Added a new 'Level Selection' page! This page is meant to present all of the playable levels to the current user. Levels are unlocked by first playing the previous level (or the first level, in this case, 'Goblin Hideout') and winning it. This sets a new 'Highest unlocked level' which allows the player to play that level and its prior levels. Hovering over a level presents the level details such as the levelName, levelDesc, the present enemies, and whether the level is 'Unlocked' or 'Locked'. Locked levels are unplayable/unavailable to the player, and hides the levelDesc and present enemies (retains level name). Levels options are dynamically stacked atop each other, level details 'slide' into the panel

#### NEW: Shop/Merchant page
- `Added`: Added a new 'Item Shop' page! This page is meant to be the main endpoint for players to unlock and purchase new cards/passives for their inventory, and make 'game progression' (aside from the main battle levels, tho some levels are dependent on specific cards!). The page features a central shop system that presents 4 purchasable cards. This roster of cards are unique to each player, and does not refresh its offers until the player either pays for a refresh, or buys all the cards in the shop (which triggers a natural shop reseeding). The item details are presented on the lefthand side of the screen, and player's gold count and the two shop options (purchase or refresh) are on the righthand side. Individual card prices are displayed underneath the cards. The shop may give discounts to certain cards upon each refresh. This discount is dynamically displayed below, showing the old price slashed out, then the new price, and then the percentage discount. A 'Sale!' tag is displayed on the card's image art when an item is on sale. Cards/Passives are presented as their image art. Item cards are dynamically 'flipped' over upon refresh and upon viewing the shop, and then reflipped, and then flipped again upon a shop refresh (like Solitare)

### Bug Fixes and Code Changes
- `Added`: Added `#region` markers to `usersModel.js` and `usersController.js` (similar to `battlesController.js` and `battlesModel.js`) to organise database operation/group functions by purpose

- `Changed`: Changed the web application to display the title 'Tales of Varion' in the browser (which is the game's title)

- `Changed`: Updated the README to present relevant information (read README for details)

- `Fixed`: Fixed a bug where new players signing up and creating a new account fail to have playerStats initialized. This was due to missing out on a stat field, 'Intelligence', which caused the server to not complete the account creation process properly

- `Fixed`: Fixed a bug where new players playerStats started their agility at 100/100 instead of 50/100 (based on a prior version's nerf)

## Version 1.2.1 - Statuses and Witches
### General Status Mechanics
- `Changed`: Changed how the server processes status effects. Now, all statuses are handled on their own by the server, removing the need for a 'general handling'. To be clear, now in `battlesController.js`, status effects are no longer classed by `dynamicStatus`, they are instead uniquely handled by what they are (e.g if (statusName === ...)...)

- `Removed`: Removed the stat fields and dynamicStatus flag for statusEffectDatabase as a follow-up to the prior change. These fields are no longer used, as seen in newer status effects. To be specific, `damage`, `heal`, `defenseUP`, `defenseDOWN` and `dynamicStatus` are removed from the statusEffectDatabase as well as the activeStatusEffectTracker (for battles). This makes handling statuses cleaner

- `Changed`: Changed single-turn status effects to not be reflected into the activeStatusTracker upon use (such as stat boost cards like 'Smart Tactics' that gives intelligence stat points). While they are statuses, they are only meant to have effect for that turn of use, and will disappear the next turn. This leaves statuses that take effect over several turns to be reflected into the activeStatusTracker, and hence onto the frontend which clutters the UI cards less.

### Specific Status Mechanics
- `Changed`: Reworked 'Cast Recovery' to the new status effect system. Using 'Cast Recovery' while 'Regeneration' is still active on the player will cause the active status duration to be extended by 1 turn (much like other status effects)

- `Changed`: Reworked 'Shield Dissolve' to the new status effect system. Using 'Shield Dissolve' while 'DefenseDOWNLvl3' is still active on an enemy will cause the active status duration to be extended by 1 turn instead

- `Changed`: Reworked 'Brace' to the new status effect system. Using **2** copies of 'Brace' in a single turn will simply heal 5 health points for that turn (no status duration increase because its meant to be a one-off ability). 'Brace' is also NOT affected by 'Curse' to give it an edge over 'Be Immaterial' and since it is *technically* not a status effect

- `Changed`: Reworked 'Be Immaterial' to the new status effect system. Using **2** copies of 'Be Immaterial' in a single turn will apply the 'Invulnerable' effect on the player whilst extending its duration by 1 turn. The activation mechanic remains, this simply prevents activating 'Be Immaterial's invulnerability in the same turn (as its meant to be activated only after the current turn, a big difference from Brace). Also affected by 'Curse' (since it is a status effect)

- `Changed`: Changed how 'Exalted Mage' heals all its allies. No longer uses a status effect to do so, instead it uses the newly made 'enemyMoveAbility' system which dictates that it can affect other enemies

### New Content and Game Changes
- `Added`: Added a new enemy, 'Forsaken Witch'! Banished from her village for practicing witchcraft, 'Forsaken Witch' unleashes her wrath onto you! Casts 'Spellproof' to protect her allies from status ailments, and 'Poison's you! Also 'Undead' cause why not

- `Added`: New 'Spellproof' mechanic. Enemies can inflict themselves with 'Spellproof' that makes them immune to negative status effects casted by the player! Currently only blocks the 2 negative status effects that can be applied to an enemy, that is 'Shield Dissolve' and 'Marked (effect)' from 'Slingshot'. More to come!

- `Changed`: Removed 'Goblin Brute' from 'Dragons Den', replaced with 'Goblin'

- `Changed`: Removed one 'Mushroom Moore' from 'Fungi Feugal', replaced with the new enemy 'Forsaken Witch'. Makes playing that level...interesting :)

- `Changed`: Removed 'Gilded Assasin' from 'Throne Room', replaced with 'Goblin Brute' to make that level vastly easier (as it was frankly unplayable LMAO). 'Goblin Brute' reduces damage output from the enemy's side while still being a big enough nuisance to the player (This is also accounting for the hidden buff that 'Throne Room' got due to 'Skeleton Warrior' being able to revive)

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
- `Changed`: Reworked the Combat engine (in `battlesController.js`) to use a local 'snapshot' of the enemy's activeBattleTable, rather than performing frequent database I/O requests. Slightly improves combat processing. Main reason was to have an easier time tracking alive enemies during combat for future 'AOE' moves

- `Removed`: Auditted `battlesController.js` to remove old commented out code to make it look cleaner/easier to read

- `Removed`: Removed the try-catch code lines in battlesController.js for fightBattle function (previously commented out). Change made to make it easier to debug the combat engine

- `Added`: Added `.gitignore` to project root because I added a `TODO.md` for my personal use

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
