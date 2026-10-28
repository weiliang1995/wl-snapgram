import type { INewPost, INewUser } from "@/types";
import { account, appwriteConfig, avatars, tablesDB, storage } from "./config";
import { AppwriteException, ID, ImageGravity, Query } from "appwrite";

export async function createUserAccount(user: INewUser) {
  const userId = ID.unique();
  const newAccount = await account.create({
    userId,
    email: user.email,
    password: user.password,
    name: user.name,
  });

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
  try {
    await account.deleteSession({ sessionId: "current" });
  } catch (e) {
    if (e instanceof AppwriteException && e.code === 401) return;
    throw e;
  }
}

export async function createPost(post: INewPost) {
  let uploadedFile;
  const file = post.file[0];
  if (!file) {
    throw new Error("No file selected");
  }
  try {
    uploadedFile = await uploadFile(file);
    if (!uploadedFile) throw new Error("File upload failed");

    const fileUrl = getFilePreview(uploadedFile.$id);
    if (!fileUrl) {
      throw new Error("File preview generation failed");
    }

    const tags = [
      ...new Set(
        (post.tags ?? "")
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];

    const rowId = ID.unique();
    const newPost = await tablesDB.createRow({
      databaseId: appwriteConfig.databaseID,
      tableId: appwriteConfig.postCollectionId,
      rowId,
      data: {
        creator: post.userId,
        caption: post.caption,
        imageUrl: fileUrl,
        imageId: uploadedFile.$id,
        location: post.location,
        tags,
      },
    });

    if (!newPost) {
      throw new Error("Post creation failed");
    }
    return newPost;
  } catch (e) {
    if (uploadedFile?.$id)
      await deleteFile(uploadedFile.$id).catch(console.error);
    throw e;
  }
}

export async function uploadFile(file: File) {
  const fileId = ID.unique();
  const uploadedFile = await storage.createFile({
    bucketId: appwriteConfig.storageID,
    fileId,
    file: file,
  });
  return uploadedFile;
}

export function getFilePreview(fileId: string) {
  const fileUrl = storage.getFilePreview({
    bucketId: appwriteConfig.storageID,
    fileId,
    width: 2000,
    height: 2000,
    gravity: ImageGravity.Top,
    quality: 100,
  });
  return fileUrl;
}

export async function deleteFile(fileId: string) {
  await storage.deleteFile({
    bucketId: appwriteConfig.storageID,
    fileId,
  });
  return { status: "ok" };
}
