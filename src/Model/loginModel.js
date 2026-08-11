import { db } from "../db/connection.js";
import { eq } from "drizzle-orm";
import { playerStats, users } from "../db/schema.js";

// Get a user by username
export const getUsername = async (username) => {
  const getRecord = await db
    .select()
    .from(users)
    .where(eq(users.username, username));
  return getRecord;
}
// Add user to the users table
export const addUser = async (username, password) => {
  const newRecord = await db
    .insert(users)
    .values({
      username: username,
      password: password,
      levelProgress: 1
    })
    .returning();
  return newRecord;
}
// Add new user player stats into playerStats
export const addPlayerStats = async (username) => {
  const newRecord = await db
    .insert(playerStats)
    .values({
      playerName: username,
      health: 30,
      defense: 0,
      agility: 100,
      passiveName: "Healthy"
    })
    .returning();
  return newRecord;
}