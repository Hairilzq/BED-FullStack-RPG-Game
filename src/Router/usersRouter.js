import { Router } from "express";
import { showCards, showEnemies, updateLoadout, updateUser } from "../Controller/usersController.js";

export const usersRoute = Router();

/** Route to update username and password */
usersRoute.put('/update', updateUser);

/** Route to update player loadout. Requires username and password. Accepts input of 5 cards */
usersRoute.put('/loadout', updateLoadout);

/** Route to show all cards for viewing */
usersRoute.get('/showCards', showCards);

/** Route to show all enemies for viewwing */
usersRoute.get('/showEnemies', showEnemies);