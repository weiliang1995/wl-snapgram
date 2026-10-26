import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Controller, useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SignupValidation } from "@/lib/validation";
import { z } from "zod";
import Loader from "@/components/shared/loader";
import { Link } from "react-router-dom";
import { useState } from "react";
import { createUserAccount } from "@/lib/appwrite/api";
import { toast } from "@/components/ui/toast";

const SignupForm = () => {
  const [isLoading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof SignupValidation>>({
    resolver: zodResolver(SignupValidation),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof SignupValidation>) {
    try {
      setLoading(true);
      const newUser = await createUserAccount(values);
      // const session = await signInAccount();
      toast.add({
        type: "success",
        title: "Account created successfully",
        description: "Auto redirecting to login, please wait...",
      });
      return newUser;
    } catch (e) {
      return toast.add({
        type: "error",
        title: "Sign up failed, please try again later.",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full xs:w-120 items-center justify-center-safe bg-card rounded-xl overflow-auto">
      <CardHeader className="w-full justify-items-center">
        <img src="/assets/images/logo.svg" alt="logo" />
        <CardTitle className="h3-bold md:h2-bold pt-2 sm:pt-4">
          Create a new account
        </CardTitle>
        <CardDescription className="text-light-3 small-medium md:base-regular">
          To use Snapgram, please enter your account details
        </CardDescription>
      </CardHeader>
      <CardContent className="w-full">
        <form
          id="signup-form"
          className="flex flex-col gap-5 w-full mt-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="signup-form-name">Name</FieldLabel>
                  <Input
                    type="text"
                    className="shad-input"
                    {...field}
                    id="signup-form-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Your name"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="username"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="signup-form-username">
                    Username
                  </FieldLabel>
                  <Input
                    type="text"
                    className="shad-input"
                    {...field}
                    id="signup-form-username"
                    aria-invalid={fieldState.invalid}
                    placeholder="Your username"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="signup-form-email">Email</FieldLabel>
                  <Input
                    type="email"
                    className="shad-input"
                    {...field}
                    id="signup-form-email"
                    aria-invalid={fieldState.invalid}
                    placeholder="Your email"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="signup-form-password">
                    Password
                  </FieldLabel>
                  <Input
                    type="password"
                    className="shad-input"
                    {...field}
                    id="signup-form-password"
                    aria-invalid={fieldState.invalid}
                    placeholder="Your password"
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
        <Field orientation="horizontal" className="justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            className={isLoading ? "cursor-not-allowed" : "cursor-pointer"}
            disabled={isLoading}
          >
            Reset
          </Button>
          <Button
            type="submit"
            className={`shad-button_primary ${isLoading ? "cursor-not-allowed" : "cursor-pointer"}`}
            form="signup-form"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex-center gap-2">
                <Loader />
              </div>
            ) : (
              "Sign Up"
            )}
          </Button>
        </Field>
        <CardDescription className="text-small-regular text-light-2 text-center mt-2">
          Already have an account?
          <Link
            to="/sign-in"
            className="text-primary-500 text-small-semibold ml-1"
          >
            Log In
          </Link>
        </CardDescription>
      </CardFooter>
    </Card>
  );
};

export default SignupForm;
