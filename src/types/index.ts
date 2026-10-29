import type { Models } from "appwrite";

export type IContextType = {
  user: IUser;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: React.Dispatch<React.SetStateAction<IUser>>;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  checkAuthUser: () => Promise<boolean>;
};

export type INavLink = {
  imgURL: string;
  route: string;
  label: string;
};

export type IUpdateUser = {
  userId: string;
  name: string;
  bio: string;
  imageId: string;
  imageUrl: URL | string;
  file: File[];
};

export type INewPost = {
  userId: string;
  caption: string;
  file: File[];
  location?: string;
  tags?: string;
};

export type IUpdatePost = {
  postId: string;
  caption: string;
  imageId: string;
  imageUrl: URL;
  file: File[];
  location?: string;
  tags?: string;
};

export type IUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  imageUrl: string;
  bio: string;
};

export type INewUser = {
  name: string;
  email: string;
  username: string;
  password: string;
};

export type ILoginUser = {
  email: string;
  password: string;
};

export type IPostCard = Models.DefaultRow & {
  caption?: string;
  tags?: string[];
  location?: string;
  imageId?: string;
  imageUrl: string;
  creator: Models.Row & {
    name: string;
    username: string;
    imageUrl: string;
  };
  likes?: Pick<Models.Row, "$id">[];
};

export type ISaveRecord = Models.Row & {
  post?: Pick<Models.Row, "$id">;
};

// users 表的 row（getCurrentUser 返回）
export type IUserRow = Models.Row & {
  accountId: string;
  name: string;
  username: string;
  email: string;
  imageUrl: string;
  bio: string;
  save?: ISaveRecord[];
};
