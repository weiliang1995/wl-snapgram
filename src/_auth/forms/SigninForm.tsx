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
import { SigninValidation } from "@/lib/validation";
import { z } from "zod";
import Loader from "@/components/shared/loader";
import { Link } from "react-router-dom";
import { useState } from "react";

type Props = {};

const SigninForm = (props: Props) => {
  const [isLoading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof SigninValidation>>({
    resolver: zodResolver(SigninValidation),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit() {
    // const newUser = await createUserAccount(values);
    // console.log(newUser, ">>>");
    // try {
    //   setLoading(true);
    //   await new Promise((resolve) => setTimeout(resolve, 1500));
    //   console.log("submit completed");
    // } catch (e) {
    //   console.error(e);
    // } finally {
    //   setLoading(false);
    // }
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
              name="username"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="signin-form-username">
                    Username
                  </FieldLabel>
                  <Input
                    type="text"
                    className="shad-input"
                    {...field}
                    id="signin-form-username"
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
            className={isLoading ? "cursor-not-allowed" : "cursor-pointer"}
            disabled={isLoading}
          >
            Reset
          </Button>
          <Button
            type="submit"
            className={`shad-button_primary ${isLoading ? "cursor-not-allowed" : "cursor-pointer"}`}
            form="signin-form"
            disabled={isLoading}
          >
            {isLoading ? (
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
