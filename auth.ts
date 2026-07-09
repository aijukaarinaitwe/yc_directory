import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import {
  AUTHOR_BY_EMAIL_QUERY,
  AUTHOR_BY_GITHUB_ID_QUERY,
} from "@/sanity/lib/queries";
import { client } from "@/sanity/lib/client";
import { writeClient } from "@/sanity/lib/write-client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const author = await client
          .withConfig({ useCdn: false })
          .fetch(AUTHOR_BY_EMAIL_QUERY, { email });

        if (!author?.password) return null;

        const isValid = await compare(password, author.password);
        if (!isValid) return null;

        return {
          id: author._id,
          name: author.name,
          email: author.email,
          image: author.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "github") {
        const githubProfile = profile as unknown as {
          id: number;
          login: string;
          bio?: string;
        };

        const existingUser = await client
          .withConfig({ useCdn: false })
          .fetch(AUTHOR_BY_GITHUB_ID_QUERY, { id: githubProfile.id });

        if (!existingUser) {
          await writeClient.create({
            _type: "author",
            id: githubProfile.id,
            name: user.name,
            username: githubProfile.login,
            email: user.email,
            image: user.image,
            bio: githubProfile.bio || "",
          });
        }
      }

      // Credentials accounts are created up front by the sign-up action,
      // so there is nothing left to do here for that provider.
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "github" && profile) {
        const githubProfile = profile as unknown as { id: number };

        const existingUser = await client
          .withConfig({ useCdn: false })
          .fetch(AUTHOR_BY_GITHUB_ID_QUERY, { id: githubProfile.id });

        token.id = existingUser?._id;
      } else if (account?.provider === "credentials" && user) {
        token.id = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      Object.assign(session, { id: token.id });
      return session;
    },
  },
});
