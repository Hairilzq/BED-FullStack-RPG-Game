import { and, eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { playerLoadout, users } from "../db/schema.js";

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