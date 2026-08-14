import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { addPlayerStats, addUser, getUsername } from '../Model/loginModel.js';
import { createLoadout } from "../Model/battlesModel.js";

export const handleLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Input vaidation guard
    const user = await getUsername(username);
    const foundUser = user[0];

    if (!foundUser) {
      return res.status(404).json({ "error": "Invalid Credentials" });
    }

    const pass = await bcrypt.compare(password, foundUser.password);
    const checkPassed = foundUser && pass;

    if (!checkPassed) {
      return res.status(404).json({ "error": "Invalid Credentials" })
    }
    // Token creation
    const token = jwt.sign(
      { id: foundUser.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    // Cookie creation
    res.cookie('authToken', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 3600000
    });
    return res.status(200).json({ "message": "Login successful!" });
  } catch (error) {
    return res.status(500).json({ "error": "Internal server error" });
  }
}
export const handleSignup = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Input guard
    if (!username || !password || username.trim().length === 0 || password.trim().length === 0) {
      return res.status(400).json({ "error": "Please provide a username and password" });
    }
    // Validation guard
    const checkUser = await getUsername(username);
    if (checkUser[0]) {
      return res.status(409).json({ "error": "Username already exists" });
    }
    // Create password hash and store user record
    const hashedPassword = await bcrypt.hash(password, 10);
    const storeUser = await addUser(username, hashedPassword);

    // Create loadout and playerStats for new user. This can be changed later on
    let createNewLoadout = await createLoadout(username, "Sword Slash");
    createNewLoadout = await createLoadout(username, "Healing Aura");
    createNewLoadout = await createLoadout(username, "Defensive Stance");
    createNewLoadout = await createLoadout(username, "Brace");
    createNewLoadout = await createLoadout(username, "Slingshot");

    const createStats = await addPlayerStats(username);

    return res.status(200).json({ "message": "User successfully created! Login at /login!" });
  } catch (error) {
    return res.status(500).json({ "error": "Internal server error" });
  }
}