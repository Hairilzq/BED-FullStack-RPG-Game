import { Router } from "express";
import { showCards, showCurrentLevel, showEnemies, showLevels, showPassives, updateLoadout } from "../Controller/usersController.js";
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

/** Route to show the authenticated player's current level */
usersRoute.get('/currentLevel', showCurrentLevel);