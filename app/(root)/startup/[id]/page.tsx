import { Suspense } from "react";
import { client } from "@/sanity/lib/client";
import {
  STARTUP_BY_ID_QUERY,
  STARTUP_SIMILAR_QUERY,
} from "@/sanity/lib/queries";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

import markdownit from "markdown-it";
import { Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import View from "@/components/View";
import StartupCard, { StartupTypeCard } from "@/components/StartupCard";
import VoteButton from "@/components/VoteButton";
import DeleteStartupButton from "@/components/DeleteStartupButton";
import { auth } from "@/auth";

const md = markdownit();

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const id = (await params).id;
  const session = await auth();

  const post = await client.fetch(
    STARTUP_BY_ID_QUERY,
    { id, userId: session?.id ?? null },
    { next: { revalidate: 60 } },
  );

  if (!post) return notFound();

  const similarPosts = post.category
    ? await client.fetch(
        STARTUP_SIMILAR_QUERY,
        { id, category: post.category, userId: session?.id ?? null },
        { next: { revalidate: 60 } },
      )
    : [];

  const parsedContent = md.render(post?.pitch || "");
  const isOwner = !!session && session.id === post.author?._id;

  return (
    <>
      <section className="pink_container !min-h-[230px]">
        <p className="tag">{formatDate(post?._createdAt)}</p>

        <h1 className="heading">{post.title}</h1>
        <p className="sub-heading !max-w-5xl">{post.description}</p>
      </section>

      <section className="section_container">
        <Image
          src={post.image || "/logo.png"}
          alt={post.title || "thumbnail"}
          width={1280}
          height={720}
          priority
          sizes="50vw"
          className="w-1/2 h-auto mx-auto rounded-xl object-cover"
        />

        <div className="space-y-5 mt-10 max-w-4xl mx-auto">
          <div className="flex-between gap-5">
            <Link
              href={`/user/${post.author?._id}`}
              className="flex gap-2 items-center mb-3"
            >
              <Image
                src={post.author?.image ?? "/logo.png"}
                alt="avatar"
                width={64}
                height={64}
                className="rounded-full drop-shadow-lg"
              />

              <div>
                <p className="text-20-medium">{post.author?.name}</p>
                <p className="text-16-medium !text-black-300">
                  @{post.author?.username}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <VoteButton
                startupId={post._id}
                initialVoted={post.hasVoted ?? false}
                initialCount={post.voteCount ?? 0}
                isLoggedIn={!!session}
              />
              <p className="category-tag">{post.category}</p>
              {isOwner && (
                <>
                  <Link
                    href={`/startup/${post._id}/edit`}
                    className="flex items-center gap-1.5 rounded-full border-2 border-black bg-white px-4 py-1.5 font-medium text-14-normal !text-black"
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Link>
                  <DeleteStartupButton startupId={post._id} />
                </>
              )}
            </div>
          </div>

          <h3 className="text-30-bold">Pitch Details</h3>
          {parsedContent ? (
            <article
              className="prose max-w-4xl font-work-sans break-all"
              dangerouslySetInnerHTML={{ __html: parsedContent }}
            />
          ) : (
            <p className="no-result">No details provided</p>
          )}
        </div>

        <hr className="divider" />

        {similarPosts.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <p className="text-30-semibold">Similar startups</p>

            <ul className="mt-7 card_grid-sm">
              {similarPosts.map((similar: StartupTypeCard) => (
                <StartupCard
                  key={similar._id}
                  post={similar}
                  isLoggedIn={!!session}
                />
              ))}
            </ul>
          </div>
        )}

        <Suspense fallback={<Skeleton className="view_skeleton" />}>
          <View id={id} />
        </Suspense>
      </section>
    </>
  );
};

export default Page;
