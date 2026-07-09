"use client";

import React, { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signInWithEmail, signInWithGitHub } from "@/lib/actions";

type FieldErrors = Record<string, string[] | string | undefined>;

const fieldError = (fieldErrors: FieldErrors | undefined, key: string) => {
  const entry = fieldErrors?.[key];
  return Array.isArray(entry) ? entry[0] : entry;
};

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [state, formAction, isPending] = useActionState(signInWithEmail, {
    error: "",
    status: "INITIAL",
  });

  const fieldErrors = (state as { fieldErrors?: FieldErrors })?.fieldErrors;

  useEffect(() => {
    if (!fieldErrors) return;

    // Only clear the field(s) that actually failed, keep the rest as typed.
    if (fieldErrors.email) setEmail("");
    if (fieldErrors.password) setPassword("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="w-full max-w-md space-y-6">
      <form action={formAction} className="startup-form !my-0 !max-w-md">
        <div>
          <label htmlFor="email" className="startup-form_label">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            className="startup-form_input"
            required
            placeholder="jane@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {fieldError(fieldErrors, "email") && (
            <p className="startup-form_error">
              {fieldError(fieldErrors, "email")}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="startup-form_label">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            className="startup-form_input"
            required
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {fieldError(fieldErrors, "password") && (
            <p className="startup-form_error">
              {fieldError(fieldErrors, "password")}
            </p>
          )}
        </div>

        {state.error && !fieldErrors && (
          <p className="startup-form_error">{state.error}</p>
        )}

        <Button
          type="submit"
          className="startup-form_btn text-white"
          disabled={isPending}
        >
          {isPending ? "Logging in..." : "Login"}
        </Button>

        <p className="text-center text-16-medium">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-primary underline">
            Sign up
          </Link>
        </p>
      </form>

      <div className="flex items-center gap-3 max-w-2xl mx-auto">
        <span className="h-px flex-1 bg-black-300/30" />
        <span className="text-14-normal !text-black-300">or</span>
        <span className="h-px flex-1 bg-black-300/30" />
      </div>

      <form action={signInWithGitHub} className="max-w-2xl mx-auto">
        <button
          type="submit"
          className="login rounded-full w-full flex justify-center"
        >
          Continue with GitHub
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
