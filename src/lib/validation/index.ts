import { FormAction } from "@/constants/post-form";
import * as z from "zod";

export const SignupValidation = z.object({
  name: z.string().min(2, { message: "Too short" }),
  username: z.string().min(2, { message: "Too short" }),
  email: z.email(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(50),
});

export const SigninValidation = z.object({
  email: z.email(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(50),
});

export const postSchema = z.object({
  caption: z.string().min(5).max(1000),
  file: z.custom<File[]>(),
  location: z.string().min(2).max(100).or(z.literal("")),
  tags: z.string(),
});

export const postValidation = (action: FormAction) =>
  action === FormAction.CREATE
    ? postSchema.refine((v) => v.file?.length > 0, {
        message: "Please upload a photo",
        path: ["file"], // so the error shows under the file field
      })
    : postSchema;

export type PostFormValues = z.infer<typeof postSchema>;
