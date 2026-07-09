import { redirect } from "next/navigation";
import { auth } from "@/auth";
import SignUpForm from "@/components/SignUpForm";

const Page = async () => {
  const session = await auth();

  if (session) redirect("/");

  return (
    <div className="w-full max-w-md">
      <h1 className="text-30-bold text-center mb-8">Create your account</h1>
      <SignUpForm />
    </div>
  );
};

export default Page;
