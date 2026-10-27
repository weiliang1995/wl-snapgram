import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { AppwriteException } from "appwrite";
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
import Loader from "@/components/shared/Loader";
import { toast } from "@/components/ui/toast";
import { useUserContext } from "@/context/AuthContext";
import { useSignInAccount } from "@/lib/react-query/queriesAndMutation";
import { SigninValidation } from "@/lib/validation";

const SigninForm = () => {
  const { mutateAsync: signInAccount, isPending: isSigningIn } =
    useSignInAccount();

  const { checkAuthUser } = useUserContext();

  const navigate = useNavigate();

  const form = useForm<z.infer<typeof SigninValidation>>({
    resolver: zodResolver(SigninValidation),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof SigninValidation>) {
    try {
      await signInAccount({
        email: values.email,
        password: values.password,
      });

      const isLoggedIn = await checkAuthUser();

      if (isLoggedIn) {
        form.reset();
        toast.add({
          type: "success",
          title: "Sign in successfully",
          description: "Auto redirecting, please wait...",
        });
        navigate("/");
      } else {
        toast.add({
          type: "error",
          title: "Authentication failed",
        });
      }
    } catch (e) {
      let title = "Something went wrong.";
      let description = "Please try again later.";
      if (e instanceof AppwriteException) {
        if (e.code === 401) {
          title = "Sign in failed";
          description = "Email or password is incorrect";
        } else if (e.code === 429) {
          title = "Rate limit exceeded";
          description = "Too many attempts, please try again later.";
        }
      }
      toast.add({
        type: "error",
        title,
        description,
      });
    }
  }

  return (
    <Card className="w-full xs:w-120 items-center justify-center-safe bg-card rounded-xl overflow-auto">
      <CardHeader className="w-full justify-items-center">
        <img src="/assets/images/logo.svg" alt="logo" />
        <CardTitle className="h3-bold md:h2-bold pt-2 sm:pt-4">
          Welcome back
        </CardTitle>
        <CardDescription className="text-light-3 small-medium md:base-regular">
          To use Snapgram, please enter your account details
        </CardDescription>
      </CardHeader>
      <CardContent className="w-full">
        <form
          id="signin-form"
          className="flex flex-col gap-5 w-full mt-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="signin-form-email">Email</FieldLabel>
                  <Input
                    type="text"
                    className="shad-input"
                    {...field}
                    id="signin-form-email"
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
                  <FieldLabel htmlFor="signin-form-password">
                    Password
                  </FieldLabel>
                  <Input
                    type="password"
                    className="shad-input"
                    {...field}
                    id="signin-form-password"
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
            className={isSigningIn ? "cursor-not-allowed" : "cursor-pointer"}
            disabled={isSigningIn}
          >
            Reset
          </Button>
          <Button
            type="submit"
            className={`shad-button_primary ${isSigningIn ? "cursor-not-allowed" : "cursor-pointer"}`}
            form="signin-form"
            disabled={isSigningIn}
          >
            {isSigningIn ? (
              <div className="flex-center gap-2">
                <Loader />
              </div>
            ) : (
              "Log In"
            )}
          </Button>
        </Field>
        <CardDescription className="text-small-regular text-light-2 text-center mt-2">
          Don't have an account?
          <Link
            to="/sign-up"
            className="text-primary-500 text-small-semibold ml-1"
          >
            Register
          </Link>
        </CardDescription>
      </CardFooter>
    </Card>
  );
};

export default SigninForm;
