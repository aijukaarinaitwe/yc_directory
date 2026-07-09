import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginForm from "@/components/LoginForm";

const Page = async () => {
  const session = await auth();

  if (session) redirect("/");

  return (
    <div className="w-full max-w-md">
      <h1 className="text-30-bold text-center mb-8">Log in</h1>
      <LoginForm />
    </div>
  );
};

export default Page;
