import EmptyUI from "@/components/shared/EmptyUI";
import Loader from "@/components/shared/Loader";
import PostStats from "@/components/shared/PostStats";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { TOAST_TYPE } from "@/constants/toast";
import { useUserContext } from "@/context/AuthContext";
import {
  useDeletePost,
  useGetPostById,
} from "@/lib/react-query/queriesAndMutation";
import { useParams, Link, useNavigate } from "react-router-dom";

const PostDetails = () => {
  const { id } = useParams();
  const { data: post, isPending, isError } = useGetPostById(id ?? "");
  const { user } = useUserContext();
  const { mutate: deletePost, isPending: isDeleting } = useDeletePost();
  const navigate = useNavigate();

  if (!id || isError) return <EmptyUI type="error" />;
  if (isPending) return <Loader />;
  const handleDeletePost = () => {
    deletePost(
      {
        postId: post.$id,
        imageId: post.imageId,
      },
      {
        onSuccess: () => {
          toast.add({
            type: TOAST_TYPE.SUCCESS,
            title: "Post deleted",
            description: "Redirecting back to homepage...",
          });
          navigate("/");
        },
        onError: (error) =>
          toast.add({
            type: TOAST_TYPE.ERROR,
            title: "Something went wrong",
            description: error.message,
          }),
      },
    );
  };

  return (
    <div className="post_details-container">
      {isPending ? (
        <Loader />
      ) : (
        <div className="post_details-card">
          <img src={post.imageUrl} alt="post" className="post_details-img" />
          <div className="post_details-info">
            <div className="flex-between w-full flex-wrap gap-x-4 gap-y-3">
              <Link
                to={`/profile/${post.creator.$id}`}
                className="flex items-center gap-3 min-w-0"
              >
                <img
                  src={
                    post.creator.imageUrl ||
                    "/assets/icons/profile-placeholder.svg"
                  }
                  alt="creator"
                  className="rounded-full w-12 lg:h-12 shrink-0"
                />
                <div className="flex gap-1 flex-col min-w-0">
                  <p className="base-medium lg:body-bold text-light-1 truncate">
                    {post.creator.name}
                  </p>
                  {post.location && (
                    <span className="flex-center gap-0.5">
                      <img src="/assets/icons/location.svg" />
                      <p className="subtle-semibold lg:small-regular text-light-3 truncate">
                        {post.location}
                      </p>
                    </span>
                  )}
                </div>
              </Link>

              <div className="flex-center gap-4 shrink-0">
                {user.id === post.creator.$id && (
                  <>
                    <Link to={`/update-post/${post.$id}`}>
                      <img
                        src="/assets/icons/edit.svg"
                        alt="edit"
                        width={24}
                        height={24}
                        className="rounded-md"
                      />
                    </Link>
                    <Button
                      onClick={handleDeletePost}
                      variant="ghost"
                      className="post_details-delete_btn cursor-pointer"
                      disabled={isDeleting}
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
                <p className="small-regular">{post.caption}</p>
              </span>
              {!!post.tags?.length && (
                <p className="flex-start gap-1 mt-2 small-regular text-light-4">
                  #{post?.tags?.join(" #")}
                </p>
              )}
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
