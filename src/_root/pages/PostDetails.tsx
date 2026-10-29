import Loader from "@/components/shared/Loader";
import PostStats from "@/components/shared/PostStats";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/context/AuthContext";
import { useGetPostById } from "@/lib/react-query/queriesAndMutation";
import { use } from "react";
import { useParams, Link } from "react-router-dom";

const PostDetails = () => {
  const { id } = useParams();
  const { data: post, isPending } = useGetPostById(id ?? "");
  const { user } = useUserContext();

  const handleDeletePost = () => {};

  return (
    <div className="post_details-container">
      {isPending ? (
        <Loader />
      ) : (
        <div className="post_details-card">
          <img src={post?.imageUrl} alt="post" className="post_details-img" />
          <div className="post_details-info">
            <div className="flex-between w-full flex-wrap gap-x-4 gap-y-3">
              <Link
                to={`/profile/${post?.creator.$id}`}
                className="flex items-center gap-3 min-w-0"
              >
                <img
                  src={
                    post?.creator?.imageUrl ||
                    "/assets/icons/profile-placeholder.svg"
                  }
                  alt="creator"
                  className="rounded-full w-12 lg:h-12 shrink-0"
                />
                <div className="flex gap-1 flex-col min-w-0">
                  <p className="base-medium lg:body-bold text-light-1 truncate">
                    {post?.creator.name}
                  </p>
                  <span className="flex-center gap-0.5">
                    <img src="/assets/icons/location.svg" />
                    <p className="subtle-semibold lg:small-regular text-light-3 truncate">
                      {post?.location}
                    </p>
                  </span>
                </div>
              </Link>

              <div className="flex-center gap-4 shrink-0">
                {user.id === post?.creator.$id && (
                  <>
                    <Link to={`/update-post/${post?.$id}`}>
                      <img
                        src="/assets/icons/edit.svg"
                        alt="edit"
                        width={24}
                        height={24}
                        className="rounded-md h-6 w-6 lg:h-12 lg:w-12"
                      />
                    </Link>
                    <Button
                      onClick={handleDeletePost}
                      variant="ghost"
                      className="post_details-delete_btn"
                    >
                      <img
                        src="/assets/icons/delete.svg"
                        width={24}
                        height={24}
                        alt="delete"
                      />
                    </Button>
                  </>
                )}
              </div>
            </div>
            <hr className="border w-full border-dark-4/80" />
            <div className="flex flex-col flex-1 w-full small-medium lg:base-regular">
              <span className="flex items-baseline gap-2">
                <p className="small-regular">{post?.caption}</p>
              </span>
              <p className="flex-start gap-1 mt-2 small-regular text-light-4">
                #{post?.tags?.join(" #")}
              </p>
            </div>
            <div className="w-full">
              <PostStats post={post} userId={user.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetails;
