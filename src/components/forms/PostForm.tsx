import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Controller, useForm } from "react-hook-form";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Loader from "@/components/shared/Loader";
import { createPostValidation } from "@/lib/validation";
import { Textarea } from "@/components/ui/textarea";
import FileUploader from "@/components/shared/FileUploader";
import type { Models } from "appwrite";
import { useCreatePost } from "@/lib/react-query/queriesAndMutation";
import { useUserContext } from "@/context/AuthContext";
import { toast } from "@/components/ui/toast";
import { useNavigate } from "react-router-dom";
import { TOAST_TYPE } from "@/constants/toast";

type Post = Models.Document & {
  caption?: string;
  location?: string;
  tags?: string[];
  imageUrl: string;
  imageId: string;
};
type PostFormProps = {
  post?: Post;
};

const PostForm = ({ post }: PostFormProps) => {
  const { mutate: createPost, isPending: isCreatingPost } = useCreatePost();

  const { user } = useUserContext();

  const navigate = useNavigate();

  const form = useForm<z.infer<typeof createPostValidation>>({
    resolver: zodResolver(createPostValidation),
    defaultValues: {
      caption: post?.caption ?? "",
      file: [],
      location: post?.location ?? "",
      tags: post?.tags?.join(", ") ?? "",
    },
  });

  function onSubmit(values: z.infer<typeof createPostValidation>) {
    createPost(
      {
        ...values,
        userId: user.id,
      },
      {
        onSuccess: () => {
          toast.add({
            type: TOAST_TYPE.SUCCESS,
            title: "Create post successfully",
            description: "Redirecting to homepage...",
          });
          navigate("/");
        },
        onError: (error) => {
          toast.add({
            type: TOAST_TYPE.ERROR,
            title: "Something went wrong",
            description: error.message,
          });
        },
      },
    );
  }
  return (
    <Card className="w-full items-center justify-center-safe bg-card rounded-xl overflow-auto">
      <CardContent className="w-full">
        <form
          id="create-post"
          className="flex flex-col gap-9 w-full max-w-5xl"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              name="caption"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    className="shad-form_label"
                    htmlFor="create-post-caption"
                  >
                    Caption
                  </FieldLabel>
                  <Textarea
                    className="shad-textarea custom-scrollbar"
                    {...field}
                    id="create-post-caption"
                    aria-invalid={fieldState.invalid}
                    placeholder="Write something here..."
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="file"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    className="shad-form_label"
                    htmlFor="create-post-file"
                  >
                    Add Photos
                  </FieldLabel>
                  <FileUploader
                    fieldValue={field.value}
                    fieldChange={field.onChange}
                    mediaUrl={post?.imageUrl ?? ""}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="location"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    className="shad-form_label"
                    htmlFor="create-post-location"
                  >
                    Add Location
                  </FieldLabel>
                  <Input
                    type="text"
                    className="shad-input"
                    {...field}
                    id="create-post-location"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter the location"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="tags"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    className="shad-form_label"
                    htmlFor="create-post-tags"
                  >
                    Add Tags (separated by comma " , ")
                  </FieldLabel>
                  <Input
                    type="text"
                    className="shad-input"
                    {...field}
                    id="create-post-tags"
                    aria-invalid={fieldState.invalid}
                    placeholder="Art, Expression, Learn"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="w-full flex flex-col">
        <Field
          orientation="horizontal"
          className="justify-end flex gap-4 items-center"
        >
          <Button
            type="button"
            variant="outline"
            className={`shad-button_dark_4 border-none ${isCreatingPost ? "cursor-not-allowed" : "cursor-pointer"}`}
            onClick={() => form.reset()}
            disabled={isCreatingPost}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className={`shad-button_primary whitespace-nowrap px-4 py-5 ${isCreatingPost ? "cursor-not-allowed" : "cursor-pointer"}`}
            form="create-post"
            disabled={isCreatingPost}
          >
            {isCreatingPost ? (
              <div className="flex-center gap-2">
                <Loader />
              </div>
            ) : (
              "Create Post"
            )}
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
};

export default PostForm;
