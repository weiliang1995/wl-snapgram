import React from "react";
import {
  useDeleteSavePost,
  useGetCurrentUser,
  useLikePost,
  useSavePost,
} from "@/lib/react-query/queriesAndMutation";
import { checkIsLiked, formatPostTime } from "@/lib/utils";
import type { IPost } from "@/types";

type PostStatsProps = {
  post?: IPost;
  userId: string;
};
const PostStats = ({ post, userId }: PostStatsProps) => {
  const {
    mutate: likePost,
    isPending: isLiking,
    variables: likeVariables,
  } = useLikePost();
  const { mutate: savePost, isPending: isSaving } = useSavePost();
  const { mutate: deleteSavePost, isPending: isDeleting } = useDeleteSavePost();

  const { data: currentUser } = useGetCurrentUser();

  const likes =
    isLiking && likeVariables
      ? likeVariables.likesArray
      : (post.likes?.map((user) => user.$id) ?? []);

  const savedPostRecord = currentUser?.save?.find(
    (record) => record.post?.$id === post.$id,
  );
  // 请求进行中先显示目标状态（乐观显示），完成后以重新拉取的 currentUser 为准
  const isSaved = isSaving || (!isDeleting && !!savedPostRecord);

  const handleLikePost = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isLiking) return;

    const newLikes = likes.includes(userId)
      ? likes.filter((id) => id !== userId)
      : [...likes, userId];
    likePost({ postId: post?.$id ?? "", likesArray: newLikes });
  };

  const handleSavePost = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isSaving || isDeleting) return;
    if (savedPostRecord) {
      deleteSavePost(savedPostRecord.$id);
    } else {
      savePost({ postId: post?.$id ?? "", userId });
    }
  };

  return (
    <div className="flex-between z-20">
      <div className="flex-start gap-2 mr-5">
        <img
          src={
            checkIsLiked(likes, userId)
              ? "/assets/icons/liked.svg"
              : "/assets/icons/like.svg"
          }
          width={20}
          height={20}
          onClick={(e) => handleLikePost(e)}
          className="cursor-pointer"
        />
        <p className="small-medium lg:base-medium">{likes.length}</p>
        <img
          src="/assets/icons/chat.svg"
          width={20}
          height={20}
          onClick={() => {}}
          className="cursor-pointer"
        />
        <p className="small-medium lg:base-medium">0</p>
        <img
          src="/assets/icons/share.svg"
          width={20}
          height={20}
          onClick={() => {}}
          className="cursor-pointer"
        />
        <p className="small-medium lg:base-medium">0</p>
        <img
          src={isSaved ? "/assets/icons/saved.svg" : "/assets/icons/save.svg"}
          width={20}
          height={20}
          onClick={handleSavePost}
          className="cursor-pointer"
          alt="save"
        />
      </div>
      <p className="subtle-semibold lg:small-regular text-light-3">
        {formatPostTime(post.$createdAt)}
      </p>
    </div>
  );
};

export default PostStats;
