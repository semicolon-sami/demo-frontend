import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  // PASS THE FUNCTION, NOT THE RESULT!
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-pink-100 dark:from-gray-900 dark:to-blue-950 transition-all">
      <h1 className="mb-8 text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 text-transparent bg-clip-text">
        🎉 Welcome!
      </h1>
      <p className="mb-8 text-lg text-blue-700 dark:text-blue-200 font-medium">
        This is your private music, gallery, and diary portal. Choose what you want to do!
      </p>
      <div className="flex gap-8 flex-wrap">
        <a className="px-8 py-3 rounded-full font-bold bg-blue-500 text-white shadow-lg text-lg hover:scale-105 transition" href="/music">
          Go to Music Player
        </a>
        <a className="px-8 py-3 rounded-full font-bold bg-pink-500 text-white shadow-lg text-lg hover:scale-105 transition" href="/gallery" target="_blank">
          View Gallery (new tab)
        </a>
        <a className="px-8 py-3 rounded-full font-bold bg-blue-800 text-white shadow-lg text-lg hover:scale-105 transition" href="/diary">
          Open Diary
        </a>
        <a className="px-8 py-3 rounded-full font-bold bg-purple-500 text-white shadow-lg text-lg hover:scale-105 transition" href="/biography">
          My Biography
        </a>
        <a className="px-8 py-3 rounded-full font-bold bg-green-500 text-white shadow-lg text-lg hover:scale-105 transition" href="/future-plans">
          Future Plans
        </a>
      </div>
    </main>
  );
}
