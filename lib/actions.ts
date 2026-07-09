"use server";

import { AuthError } from "next-auth";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth, signIn } from "@/auth";
import { parseServerActionResponse } from "@/lib/utils";
import { formSchema, loginSchema, signUpSchema } from "@/lib/validation";
import slugify from "slugify";
import { client } from "@/sanity/lib/client";
import { writeClient } from "@/sanity/lib/write-client";
import {
  AUTHOR_BY_EMAIL_QUERY,
  STARTUP_OWNER_QUERY,
  STARTUP_VOTES_QUERY,
} from "@/sanity/lib/queries";

export const createPitch = async (
  state: any,
  form: FormData,
  pitch: string,
) => {
  const session = await auth();

  if (!session)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    });

  const { title, description, category, link } = Object.fromEntries(
    Array.from(form).filter(([key]) => key !== "pitch"),
  );

  const parsed = await formSchema.safeParseAsync({
    title,
    description,
    category,
    link,
    pitch,
  });

  if (!parsed.success) {
    return parseServerActionResponse({
      error: "Please check your inputs and try again",
      fieldErrors: parsed.error.flatten().fieldErrors,
      status: "ERROR",
    });
  }

  const slug = slugify(title as string, { lower: true, strict: true });

  try {
    const startup = {
      title,
      description,
      category,
      image: link,
      slug: {
        _type: slug,
        current: slug,
      },
      author: {
        _type: "reference",
        _ref: session?.id,
      },
      pitch,
    };

    const result = await writeClient.create({ _type: "startup", ...startup });

    return parseServerActionResponse({
      ...result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);

    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

const assertOwnsStartup = async (startupId: string, userId: string) => {
  const startup = await client
    .withConfig({ useCdn: false })
    .fetch(STARTUP_OWNER_QUERY, { id: startupId });

  if (!startup) return "Startup not found";
  if (startup.authorId !== userId) return "You can only manage your own startups";
  return null;
};

export const deleteStartup = async (startupId: string) => {
  const session = await auth();

  if (!session)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    });

  const ownershipError = await assertOwnsStartup(startupId, session.id);
  if (ownershipError) {
    return parseServerActionResponse({ error: ownershipError, status: "ERROR" });
  }

  try {
    await writeClient.delete(startupId);

    revalidatePath("/");
    revalidatePath(`/user/${session.id}`);

    return parseServerActionResponse({ error: "", status: "SUCCESS" });
  } catch (error) {
    console.log(error);

    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const updateStartup = async (
  startupId: string,
  state: any,
  form: FormData,
  pitch: string,
) => {
  const session = await auth();

  if (!session)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    });

  const ownershipError = await assertOwnsStartup(startupId, session.id);
  if (ownershipError) {
    return parseServerActionResponse({ error: ownershipError, status: "ERROR" });
  }

  const { title, description, category, link } = Object.fromEntries(
    Array.from(form).filter(([key]) => key !== "pitch"),
  );

  const parsed = await formSchema.safeParseAsync({
    title,
    description,
    category,
    link,
    pitch,
  });

  if (!parsed.success) {
    return parseServerActionResponse({
      error: "Please check your inputs and try again",
      fieldErrors: parsed.error.flatten().fieldErrors,
      status: "ERROR",
    });
  }

  const slug = slugify(title as string, { lower: true, strict: true });

  try {
    await writeClient
      .patch(startupId)
      .set({
        title,
        description,
        category,
        image: link,
        slug: {
          _type: slug,
          current: slug,
        },
        pitch,
      })
      .commit();

    revalidatePath(`/startup/${startupId}`);
    revalidatePath("/");
    revalidatePath(`/user/${session.id}`);

    return parseServerActionResponse({
      _id: startupId,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);

    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const uploadImage = async (formData: FormData) => {
  const session = await auth();

  if (!session)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    });

  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    return parseServerActionResponse({
      error: "No file provided",
      status: "ERROR",
    });
  }

  if (!file.type.startsWith("image/")) {
    return parseServerActionResponse({
      error: "File must be an image",
      status: "ERROR",
    });
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return parseServerActionResponse({
      error: "Image must be 5MB or smaller",
      status: "ERROR",
    });
  }

  try {
    const asset = await writeClient.assets.upload("image", file, {
      filename: file.name,
    });

    return parseServerActionResponse({
      url: asset.url,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);

    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const signUpWithEmail = async (
  state: any,
  form: FormData,
): Promise<any> => {
  const values = {
    name: form.get("name") as string,
    username: form.get("username") as string,
    email: form.get("email") as string,
    password: form.get("password") as string,
  };

  const parsed = signUpSchema.safeParse(values);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return parseServerActionResponse({
      error: "Please check your inputs and try again",
      fieldErrors,
      status: "ERROR",
    });
  }

  const { name, username, email, password } = parsed.data;

  const existing = await client
    .withConfig({ useCdn: false })
    .fetch(AUTHOR_BY_EMAIL_QUERY, { email });

  if (existing) {
    return parseServerActionResponse({
      error: "An account with this email already exists",
      fieldErrors: { email: "An account with this email already exists" },
      status: "ERROR",
    });
  }

  const hashedPassword = await hash(password, 10);

  try {
    await writeClient.create({
      _type: "author",
      name,
      username,
      email,
      password: hashedPassword,
      image: "/logo.png",
      bio: "",
    });
  } catch (error) {
    console.log(error);

    return parseServerActionResponse({
      error: "Could not create account. Please try again.",
      status: "ERROR",
    });
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return parseServerActionResponse({
        error: "Account created, but sign-in failed. Please log in.",
        status: "ERROR",
      });
    }

    throw error;
  }
};

export const signInWithEmail = async (
  state: any,
  form: FormData,
): Promise<any> => {
  const values = {
    email: form.get("email") as string,
    password: form.get("password") as string,
  };

  const parsed = loginSchema.safeParse(values);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return parseServerActionResponse({
      error: "Please check your inputs and try again",
      fieldErrors,
      status: "ERROR",
    });
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Deliberately vague about which one is wrong (avoids leaking whether
      // an account exists for that email), but only the password is cleared
      // since re-typing a correct email each time is needless friction.
      return parseServerActionResponse({
        error: "Invalid email or password",
        fieldErrors: { password: "Invalid email or password" },
        status: "ERROR",
      });
    }

    throw error;
  }
};

export const signInWithGitHub = async () => {
  await signIn("github", { redirectTo: "/" });
};

export const toggleVote = async (startupId: string) => {
  const session = await auth();

  if (!session?.id) {
    return parseServerActionResponse({
      error: "Please log in to vote",
      status: "ERROR",
    });
  }

  const startup = await client
    .withConfig({ useCdn: false })
    .fetch(STARTUP_VOTES_QUERY, { id: startupId });

  if (!startup) {
    return parseServerActionResponse({
      error: "Startup not found",
      status: "ERROR",
    });
  }

  const voterIds: string[] = startup.voterIds ?? [];
  const alreadyVoted = voterIds.includes(session.id);

  const nextVoterIds = alreadyVoted
    ? voterIds.filter((id) => id !== session.id)
    : [...voterIds, session.id];

  try {
    await writeClient
      .patch(startupId)
      .set({
        votes: nextVoterIds.map((id) => ({
          _type: "reference",
          _ref: id,
          _key: id,
        })),
      })
      .commit();

    return parseServerActionResponse({
      voted: !alreadyVoted,
      voteCount: nextVoterIds.length,
      status: "SUCCESS",
      error: "",
    });
  } catch (error) {
    console.log(error);

    return parseServerActionResponse({
      error: "Could not update your vote. Please try again.",
      status: "ERROR",
    });
  }
};
