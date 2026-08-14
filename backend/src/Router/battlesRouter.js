import { Router } from "express";
import { fightBattle, initiateLevels, resetBattle } from "../Controller/battlesController.js";
import { verifyToken } from "../Middleware/verifyToken.js";

export const battlesRoute = Router();

// All routes are protected by verifyToken
battlesRoute.use(verifyToken);

/** Route to initiate series of preset levels */
battlesRoute.post('/initiateLevel', initiateLevels);

/** Route to reset current battle */
battlesRoute.delete('/reset', resetBattle);

/** Route to participate in current battle */
battlesRoute.put('/fight', fightBattle);