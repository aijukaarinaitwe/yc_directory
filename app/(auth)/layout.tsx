import Link from "next/link";
import Image from "next/image";

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="font-work-sans min-h-screen flex flex-col items-center bg-white-100 dark:bg-black-200 transition-colors">
      <header className="w-full px-5 py-3">
        <Link href="/">
          <Image src="/logo.png" alt="logo" width={144} height={30} />
        </Link>
      </header>

      <div className="w-full flex-1 flex items-center justify-center px-6 py-10">
        {children}
      </div>
    </main>
  );
}
