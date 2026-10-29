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

// ===== DB rows（从 Appwrite 读出来的数据）=====
// 关系列只有在 Query.select 里指定了才会返回，所以都标为可选

export type ISaveRecord = Models.Row & {
  post?: Pick<Models.Row, "$id">;
};

// users 表的 row（getCurrentUser 返回，也是 post.creator 的类型）
export type IUserRow = Models.Row & {
  accountId: string;
  name: string;
  username: string;
  email: string;
  imageUrl: string;
  bio: string;
  save?: ISaveRecord[];
};

// posts 表的 row（列表、详情、编辑共用）
export type IPost = Models.Row & {
  caption?: string;
  tags?: string[];
  location?: string;
  imageId: string;
  imageUrl: string;
  creator: IUserRow;
  likes?: Pick<Models.Row, "$id">[];
};

// ===== Post 写入参数（表单 → api）=====

export type INewPost = {
  userId: string;
  caption: string;
  file: File[];
  location?: string;
  tags?: string; // 表单里是逗号分隔的字符串，api 层再拆成数组
};

export type IUpdatePost = {
  postId: string;
  caption: string;
  imageId: string;
  imageUrl: string;
  file: File[]; // 为空表示不换图
  location?: string;
  tags?: string;
};
