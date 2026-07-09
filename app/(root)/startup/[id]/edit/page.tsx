import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { client } from "@/sanity/lib/client";
import { STARTUP_BY_ID_QUERY } from "@/sanity/lib/queries";
import StartupForm from "@/components/StartupForm";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const id = (await params).id;
  const session = await auth();

  if (!session) redirect("/login");

  const post = await client
    .withConfig({ useCdn: false })
    .fetch(STARTUP_BY_ID_QUERY, { id, userId: session.id });

  if (!post) return notFound();

  if (post.author?._id !== session.id) redirect(`/startup/${id}`);

  return (
    <>
      <section className="pink_container !min-h-[230px]">
        <h1 className="heading">Edit Your Startup</h1>
      </section>

      <StartupForm
        mode="edit"
        startupId={id}
        initialValues={{
          title: post.title ?? "",
          description: post.description ?? "",
          category: post.category ?? "",
          image: post.image ?? "",
          pitch: post.pitch ?? "",
        }}
      />
    </>
  );
};

export default Page;
