import React from "react";
import { client } from "@/sanity/lib/client";
import { STARTUPS_BY_AUTHOR_QUERY } from "@/sanity/lib/queries";
import StartupCard, { StartupTypeCard } from "@/components/StartupCard";
import { auth } from "@/auth";

const UserStartups = async ({ id }: { id: string }) => {
  const session = await auth();
  const startups = await client.fetch(
    STARTUPS_BY_AUTHOR_QUERY,
    { id, userId: session?.id ?? null },
    { next: { revalidate: 60 } },
  );

  return (
    <>
      {startups.length > 0 ? (
        startups.map((startup: StartupTypeCard) => (
          <StartupCard
            key={startup._id}
            post={startup}
            isLoggedIn={!!session}
          />
        ))
      ) : (
        <p className="no-result">No posts yet</p>
      )}
    </>
  );
};
export default UserStartups;
