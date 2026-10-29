import type { INewPost, INewUser, IPostCard, IUserRow } from "@/types";
import { account, appwriteConfig, avatars, tablesDB, storage } from "./config";
import { AppwriteException, ID, Query } from "appwrite";

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
  try {
    return await account.createEmailPasswordSession({
      email: user.email,
      password: user.password,
    });
  } catch (e) {
    // 只有已存在 session 时才删除再重试，避免未登录时多出一个 401 请求
    if (
      e instanceof AppwriteException &&
      e.type === "user_session_already_exists"
    ) {
      await account.deleteSession({ sessionId: "current" });
      return await account.createEmailPasswordSession({
        email: user.email,
        password: user.password,
      });
    }
    throw e;
  }
}

export async function getCurrentUser() {
  let currentAccount;
  try {
    currentAccount = await account.get();
  } catch (e) {
    if (e instanceof AppwriteException && e.code === 401) return null;
    throw e;
  }

  const currentUser = await tablesDB.listRows<IUserRow>({
    databaseId: appwriteConfig.databaseID,
    tableId: appwriteConfig.userCollectionId,
    queries: [
      Query.equal("accountId", currentAccount.$id),
      Query.select(["*", "save.$id", "save.post.$id"]),
    ],
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

    const fileUrl = getFileView(uploadedFile.$id);
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

export function getFileView(fileId: string) {
  const fileUrl = storage.getFileView({
    bucketId: appwriteConfig.storageID,
    fileId,
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

export async function getRecentPosts() {
  const posts = await tablesDB.listRows<IPostCard>({
    databaseId: appwriteConfig.databaseID,
    tableId: appwriteConfig.postCollectionId,
    queries: [
      Query.select(["*", "creator.*", "likes.$id"]),
      Query.orderDesc("$createdAt"),
      Query.limit(20),
    ],
  });

  if (!posts) {
    throw new Error("Query failed");
  }
  return posts;
}

export async function likePost(postId: string, likesArray: string[]) {
  const updatedPost = await tablesDB.updateRow({
    databaseId: appwriteConfig.databaseID,
    tableId: appwriteConfig.postCollectionId,
    rowId: postId,
    data: {
      likes: likesArray,
    },
  });

  return updatedPost;
}

export async function savePost(postId: string, userId: string) {
  const rowId = ID.unique();
  const savedPost = await tablesDB.createRow({
    databaseId: appwriteConfig.databaseID,
    tableId: appwriteConfig.saveCollectionId,
    rowId,
    data: {
      user: userId,
      post: postId,
    },
  });

  return savedPost;
}

export async function deleteSavedPost(savedRecordId: string) {
  const statusCode = await tablesDB.deleteRow({
    databaseId: appwriteConfig.databaseID,
    tableId: appwriteConfig.saveCollectionId,
    rowId: savedRecordId,
  });

  return statusCode;
}
