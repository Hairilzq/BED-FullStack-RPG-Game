import { Router } from "express";
import { fightBattle, initiateBattle, initiateLevels, resetBattle } from "../Controller/battlesController.js";

export const battlesRoute = Router();

/** Route to initiate a battle */
battlesRoute.post('/initiate', initiateBattle);

/** Route to initiate series of preset levels */
battlesRoute.post('/initiate-Level', initiateLevels);

/** Route to reset current battle */
battlesRoute.delete('/reset', resetBattle);

/** Route to participate in current battle */
battlesRoute.put('/fight', fightBattle);