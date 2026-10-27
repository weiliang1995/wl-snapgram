import type { INewUser } from "@/types";
import { account, appwriteConfig, avatars, tablesDB } from "./config";
import { AppwriteException, ID, Query } from "appwrite";

export async function createUserAccount(user: INewUser) {
  const userId = ID.unique();
  const newAccount = await account.create({
    userId,
    email: user.email,
    password: user.password,
    name: user.name,
  });

  if (!newAccount) throw new Error();
  const avatarUrl = avatars.getInitials({ name: user.name });

  const newUser = await saveUserToDB({
    accountId: newAccount.$id,
    name: newAccount.name,
    email: newAccount.email,
    username: user.username,
    imageUrl: avatarUrl,
  });

  return newUser;
}

export async function saveUserToDB(user: {
  accountId: string;
  email: string;
  name: string;
  imageUrl: string;
  username?: string;
}) {
  const newUser = await tablesDB.createRow({
    databaseId: appwriteConfig.databaseID,
    tableId: appwriteConfig.userCollectionId,
    data: user,
    rowId: user.accountId,
  });
  return newUser;
}

export async function signInAccount(user: { email: string; password: string }) {
  await account.deleteSession({ sessionId: "current" }).catch(() => {});

  const session = await account.createEmailPasswordSession({
    email: user.email,
    password: user.password,
  });
  return session;
}

export async function getCurrentUser() {
  let currentAccount;
  try {
    currentAccount = await account.get();
  } catch (e) {
    if (e instanceof AppwriteException && e.code === 401) return null;
    throw e;
  }

  const currentUser = await tablesDB.listRows({
    databaseId: appwriteConfig.databaseID,
    tableId: appwriteConfig.userCollectionId,
    queries: [Query.equal("accountId", currentAccount.$id)],
  });

  return currentUser.rows[0] ?? null;
}

export async function signOutAccount() {
  return account.deleteSession({ sessionId: "current" });
}
