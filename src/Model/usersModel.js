import { and, eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { playerLoadout, users } from "../db/schema.js";

/** Updates user password based on previous username and password */
export const updateUserPassword = async (cleanRequestedUser, cleanUserPassword, cleanNewUsername, cleanNewPassword) => {
  const updatedRecord = await db
    .update(users)
    .set({
      username: cleanNewUsername,
      password: cleanNewPassword
    })
    .where(and(
      eq(users.username, cleanRequestedUser),
      eq(users.password, cleanUserPassword)))
    .returning();
  return updatedRecord;
};

/** Fetches a user based on its username and password. If mismatch, return empty record */
export const getUser = async (cleanRequestedUser, cleanUserPassword) => {
  const getRecord = await db
    .select()
    .from(users)
    .where(and(
      eq(users.username, cleanRequestedUser),
      eq(users.password, cleanUserPassword)
    ));
  return getRecord;
}