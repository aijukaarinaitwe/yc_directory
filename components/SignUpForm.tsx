"use client";

import React, { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signUpWithEmail } from "@/lib/actions";

type FieldErrors = Record<string, string[] | string | undefined>;

const fieldError = (fieldErrors: FieldErrors | undefined, key: string) => {
  const entry = fieldErrors?.[key];
  return Array.isArray(entry) ? entry[0] : entry;
};

const SignUpForm = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [state, formAction, isPending] = useActionState(signUpWithEmail, {
    error: "",
    status: "INITIAL",
  });

  const fieldErrors = (state as { fieldErrors?: FieldErrors })?.fieldErrors;

  useEffect(() => {
    if (!fieldErrors) return;

    // Only clear the field(s) that actually failed, keep the rest as typed.
    if (fieldErrors.name) setName("");
    if (fieldErrors.username) setUsername("");
    if (fieldErrors.email) setEmail("");
    if (fieldErrors.password) setPassword("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="startup-form !my-0 !max-w-md">
      <div>
        <label htmlFor="name" className="startup-form_label">
          Name
        </label>
        <Input
          id="name"
          name="name"
          className="startup-form_input"
          required
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {fieldError(fieldErrors, "name") && (
          <p className="startup-form_error">
            {fieldError(fieldErrors, "name")}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="username" className="startup-form_label">
          Username
        </label>
        <Input
          id="username"
          name="username"
          className="startup-form_input"
          required
          placeholder="janedoe"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        {fieldError(fieldErrors, "username") && (
          <p className="startup-form_error">
            {fieldError(fieldErrors, "username")}
          </p>
        )}
      </div>

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
          minLength={8}
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {fieldError(fieldErrors, "password") && (
          <p className="startup-form_error">
            {fieldError(fieldErrors, "password")}
          </p>
        )}
      </div>

      {state.error && <p className="startup-form_error">{state.error}</p>}

      <Button
        type="submit"
        className="startup-form_btn text-white"
        disabled={isPending}
      >
        {isPending ? "Creating account..." : "Sign Up"}
      </Button>

      <p className="text-center text-16-medium">
        Already have an account?{" "}
        <Link href="/login" className="text-primary underline">
          Log in
        </Link>
      </p>
    </form>
  );
};

export default SignUpForm;
