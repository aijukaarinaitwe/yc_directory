import { Suspense } from "react";
import SearchForm from "@/components/SearchForm";
import StartupCard, {
  StartupCardSkeleton,
  StartupTypeCard,
} from "@/components/StartupCard";
import { STARTUPS_QUERY } from "@/sanity/lib/queries";
import { sanityFetch, SanityLive } from "@/sanity/lib/live";
import { auth } from "@/auth";

const StartupsList = async ({ query }: { query?: string }) => {
  const session = await auth();
  const params = { search: query || null, userId: session?.id ?? null };
  const { data: posts } = await sanityFetch({ query: STARTUPS_QUERY, params });

  return posts?.length > 0 ? (
    posts.map((post: StartupTypeCard) => (
      <StartupCard key={post?._id} post={post} isLoggedIn={!!session} />
    ))
  ) : (
    <p className="no-results">No startups found</p>
  );
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const query = (await searchParams).query;

  return (
    <>
      <section className="pink_container">
        <h1 className="heading">
          Pitch Your Startup, <br />
          Connect With Entrepreneurs
        </h1>

        <p className="sub-heading !max-w-3xl">
          Submit Ideas, Vote on Pitches, and Get Noticed in Virtual
          Competitions.
        </p>

        <SearchForm query={query} />
      </section>

      <section className="section_container">
        <p className="text-30-semibold">
          {query ? `Search results for "${query}"` : "All Startups"}
        </p>

        <ul className="mt-7 card_grid">
          <Suspense fallback={<StartupCardSkeleton />}>
            <StartupsList query={query} />
          </Suspense>
        </ul>
      </section>

      <SanityLive />
    </>
  );
}
