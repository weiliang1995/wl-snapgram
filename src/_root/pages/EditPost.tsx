import PostForm from "@/components/forms/PostForm";
import EmptyUI from "@/components/shared/EmptyUI";
import Loader from "@/components/shared/Loader";
import { FormAction } from "@/constants/post-form";
import { useGetPostById } from "@/lib/react-query/queriesAndMutation";
import { useParams } from "react-router-dom";

const EditPost = () => {
  const { id } = useParams();

  const { data: post, isPending, isError } = useGetPostById(id ?? "");

  if (!id || isError) return <EmptyUI type="error" />;
  if (isPending) return <Loader />;

  return (
    <div className="flex flex-1">
      <div className="common-container">
        <div className="max-w-5xl flex-start gap-3 justify-start w-full">
          <img src="/assets/icons/edit.svg" width={36} height={36} alt="edit" />
          <h2 className="h3-bold md:h2-bold w-full text-left">Edit Post</h2>
        </div>
        <PostForm post={post} action={FormAction.UPDATE} />
      </div>
    </div>
  );
};

export default EditPost;
