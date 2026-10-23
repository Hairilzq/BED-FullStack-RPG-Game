import { and, eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { levelTemplates, playerLoadout, users } from "../db/schema.js";

//** Mostly deprecated file used for user features. May be replaced in the future*/

/** Updates user password based on previous username and password */
export const updateUserPassword = async (username, cleanNewUsername, cleanNewPassword) => {
  const updatedRecord = await db
    .update(users)
    .set({
      username: cleanNewUsername,
      password: cleanNewPassword
    })
    .where(eq(users.username, username))
    .returning();
  return updatedRecord;
};

/** Fetches a user based on its username */
export const getUser = async (username) => {
  const getRecord = await db
    .select()
    .from(users)
    .where(eq(users.username, username));
  return getRecord;
}

/** Fetches the current level name for a user without selecting other user data */
export const getCurrentLevelByUsername = async (username) => {
  const getRecord = await db
    .select({ levelName: levelTemplates.levelName })
    .from(users)
    .innerJoin(levelTemplates, eq(users.levelProgress, levelTemplates.id))
    .where(eq(users.username, username));
  return getRecord[0];
};