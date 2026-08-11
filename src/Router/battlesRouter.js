import { Router } from "express";
import { fightBattle, initiateBattle, initiateLevels, resetBattle } from "../Controller/battlesController.js";
import { verifyToken } from "../Middleware/verifyToken.js";

export const battlesRoute = Router();

// All routes are protected by verifyToken
battlesRoute.use(verifyToken);

/** Route to initiate a battle - Deprecated */
battlesRoute.post('/initiate', initiateBattle);

/** Route to initiate series of preset levels */
battlesRoute.post('/initiateLevel', initiateLevels);

/** Route to reset current battle - Deprecated route */
battlesRoute.delete('/reset', resetBattle);

/** Route to participate in current battle */
battlesRoute.put('/fight', fightBattle);