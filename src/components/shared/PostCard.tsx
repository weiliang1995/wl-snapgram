import { Card } from "@/components/ui/card";
import type { IPost } from "@/types";
import { Link } from "react-router-dom";
import { useUserContext } from "@/context/AuthContext";
import PostStats from "@/components/shared/PostStats";

const PostCard = ({ post }: { post: IPost }) => {
  const { user } = useUserContext();

  return (
    <Link to={`/posts/${post.$id}`}>
      <Card className="post-card">
        <div className="flex-between w-full">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${post.creator.$id}`}>
              <img
                src={
                  post?.creator?.imageUrl ||
                  "/assets/icons/profile-placeholder.svg"
                }
                alt="creator"
                className="rounded-full w-12 lg:h-12"
              />
            </Link>
            <div className="flex flex-col">
              <Link
                to={`/profile/${post.creator.$id}`}
                className="base-medium lg:body-bold text-light-1"
              >
                {post?.creator.name}
              </Link>
              <span className="flex-center gap-0.5">
                <img src="/assets/icons/location.svg" />
                <p className="subtle-semibold lg:small-regular text-light-3">
                  {post?.location}
                </p>
              </span>
            </div>
          </div>
          {user.id === post.creator.$id && (
            <Link to={`/update-post/${post.$id}`}>
              <img src="/assets/icons/edit.svg" width={20} />
            </Link>
          )}
        </div>
        <img
          src={post.imageUrl || "/assets/icons/profile-placeholder.svg"}
          className="post-card_img"
        />
        <PostStats post={post} userId={user.id} />
        <span className="flex items-baseline gap-2">
          <Link to={`/profile/${post.creator.$id}`} className="base-semibold">
            {post.creator.name}
          </Link>
          <p className="small-regular">{post.caption}</p>
        </span>
        <p className="flex-start gap-1 mt-2 small-regular text-light-4">
          #{post.tags?.join(" #")}
        </p>
      </Card>
    </Link>
  );
};

export default PostCard;
