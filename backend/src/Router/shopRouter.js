import { Router } from "express";
import { verifyToken } from "../Middleware/verifyToken.js";
import { getUnownedCards, handlePurchases, showShopRoster } from "../Controller/shopController.js";

export const shopRoute = Router();

// All routes to be protected by verifyToken
shopRoute.use(verifyToken);

/** Route to show player's unowned cards for GameCatalog */
shopRoute.get('/showUnownedItems', getUnownedCards);

/** Route to show shopRoster */
shopRoute.put('/showShopRoster', showShopRoster);

/** Route to access show and make purchases */
shopRoute.put('/purchaseItem', handlePurchases);