import { Router } from "express";
import { getUserBattleData, getUserData, getUserInventory, getUserProgression, showCards, showCurrentLevel, showEnemies, showLevels, showPassives, updateLoadout } from "../Controller/usersController.js";
import { verifyToken } from "../Middleware/verifyToken.js";

export const usersRoute = Router();

// All routes to be protected by verifyToken
usersRoute.use(verifyToken);

/** Route to update player loadout. Accepts input of 5 cards and 1 passive */
usersRoute.put('/loadout', updateLoadout);

/** Route to show all cards for viewing */
usersRoute.get('/showCards', showCards);

/** Route to show all passives */
usersRoute.get('/showPassives', showPassives);

/** Route to show all enemies for viewwing */
usersRoute.get('/showEnemies', showEnemies);

/** Route to show all levels */
usersRoute.get('/showLevels', showLevels);

/** Route to show general user data */
usersRoute.get('/showUserData', getUserData);

/** Route to show general user battle data */
usersRoute.get('/showUserBattleData', getUserBattleData);

/** Route to show user inventory */
usersRoute.get('/showUserInventory', getUserInventory);

/** Route to show user level progression details - Made by AI */
usersRoute.get('/showUserProgression', getUserProgression);

/** Route to show the authenticated player's current level */
usersRoute.get('/currentLevel', showCurrentLevel);