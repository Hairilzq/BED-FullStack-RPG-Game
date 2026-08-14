import { Router } from "express";
import jwt from "jsonwebtoken";
import { handleLogin, handleSignup } from "../Controller/loginController.js";

export const loginRoute = Router();

//Login Route. Unprotected by middleware
loginRoute.post('/', handleLogin);

//Signup Route. Unprotected by middleware
loginRoute.post('/signup', handleSignup);