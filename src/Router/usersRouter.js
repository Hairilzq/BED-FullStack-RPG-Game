import { Router } from "express";
import { showCardbyId, showCards, showEnemies, showPassives, updateLoadout, updateUser } from "../Controller/usersController.js";

export const usersRoute = Router();

/** Route to update username and password */
usersRoute.put('/update', updateUser);

/** Route to update player loadout. Requires username and password. Accepts input of 5 cards and 1 passive */
usersRoute.put('/loadout', updateLoadout);

/** Route to show all cards for viewing */
usersRoute.get('/showCards', showCards);

/** Route to show a specific card by Id */
usersRoute.get('/showCard/:id', showCardbyId);

/** Route to show all passives */
usersRoute.get('/showPassives', showPassives);

/** Route to show all enemies for viewwing */
usersRoute.get('/showEnemies', showEnemies);