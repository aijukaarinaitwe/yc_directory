import { z } from "zod";

export const formSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title is required")
    .max(100)
    .regex(/^[a-zA-Z0-9]/, "Title must start with a letter or number"),
  description: z.string().trim().min(20, "Description is required").max(500),
  category: z.string().trim().min(3, "Category is required").max(20),
  link: z
    .string()
    .trim()
    .min(1, "Image is required")
    .url()
    .refine(async (url) => {
      try {
        const res = await fetch(url, { method: "HEAD" });
        const contentType = res.headers.get("content-type");

        return contentType?.startsWith("image/");
      } catch {
        return false;
      }
    }),
  pitch: z.string().trim().min(10, "Pitch is required"),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, - and _",
    ),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
