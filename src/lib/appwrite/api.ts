import type { INewUser } from "@/types";
import { account, appwriteConfig, avatars, tablesDB } from "./config";
import { ID } from "appwrite";

export async function createUserAccount(user: INewUser) {
    const newAccount = await account.create({
        userId: ID.unique(),
        email: user.email,
        password: user.password,
        name: user.name,
    })

    if (!newAccount) throw new Error();
    const avatarUrl = avatars.getInitials({ name: user.name });

    const newUser = await saveUserToDB({
        accountId: newAccount.$id,
        name: newAccount.name,
        email: newAccount.email,
        username: user.username,
        imageURL: avatarUrl,
    });

    return newUser;
}

export async function saveUserToDB(user: {
    accountId: string;
    email: string;
    name: string;
    imageURL: string;
    username?: string;
}) {
    const newUser = await tablesDB.createRow({
        databaseId: appwriteConfig.databaseID,
        tableId: appwriteConfig.userCollectionId,
        rowId: ID.unique(),
        data: user,
    })
    return newUser;
}