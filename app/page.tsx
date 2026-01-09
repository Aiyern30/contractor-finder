"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { ArrowRight, Shield, Zap, CheckCircle } from "lucide-react";
import { UserNav } from "@/components/layout/user-nav";
import type { User } from "@supabase/supabase-js";

export default function Home() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleDashboardClick = () => {
    router.push("/dashboard");
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0A0A0A] selection:bg-indigo-500/30 font-sans">
      {/* Abstract Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[50%] h-[60%] rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20 text-center">
        {user && (
          <div className="absolute top-6 right-6">
            <UserNav />
          </div>
        )}

        <div className="animate-in fade-in zoom-in duration-1000 slide-in-from-bottom-10 flex flex-col items-center max-w-4xl mx-auto">
          <div className="mb-8 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-300 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            The #1 Marketplace for Contractors
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-8 leading-tight">
            Find the
            <span className="relative whitespace-nowrap">
              <span className="relative z-10 text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400">
                Perfect Pro
              </span>
              <svg
                aria-hidden="true"
                viewBox="0 0 418 42"
                className="absolute left-0 top-2/3 h-[0.58em] w-full fill-indigo-500/20 z-0"
                preserveAspectRatio="none"
              >
                <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C46.169 16.29 29.819 19.381 18.654 21.666 4.38 24.585.556 26.657.106 27.682c-.347.79.626 1.348 2.378 1.487 7.212.573 23.49-1.996 50.115-7.796 23.705-5.163 60.187-12.083 99.855-15.013 14.654-.925 31.911-1.325 50.597-1.168 25.437.214 47.962 1.036 65.659 2.164 12.33 1.08 23.515 2.502 33.057 4.116 8.354 1.412 18.068 3.322 28.528 5.617 19.467 4.27 49.687 9.873 66.86 11.458 5.625.52 10.932.327 15.658-.696 4.678-1.013 7.926-2.617 9.516-4.527 1.258-1.511.464-3.526-2.522-5.756-3.873-2.893-13.435-6.505-27.12-8.541-11.89-1.769-32.96-3.543-52.656-3.83-8.814-.128-20.725.109-34.909.845-12.825.666-26.471 1.77-39.957 3.34-31.42 3.658-69.64 8.272-108.775 14.004-9.336 1.368-15.54 1.589-19.334 1.173-4.226-.464-5.462-1.899-5.186-3.793.899-6.173 17.587-10.749 39.46-13.922 25.183-3.655 56.404-5.266 84.773-4.646 13.911.304 22.846 1.066 35.808 2.593 1.83.216 1.545-2.655-.373-2.859-19.183-2.046-44.156-2.735-65.039-1.921-22.612.882-41.442 3.12-42.36 3.237-7.893 1.006-25.042 3.791-24.316 2.059z"></path>
              </svg>
            </span>
            <br />
            For Your Project
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-400 mb-12 leading-relaxed">
            Connect with verified professionals in minutes. From quick repairs
            to major renovations, get the job done right with our trusted
            network of contractors.
          </p>

          <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-4">
            {user ? (
              <button
                className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-white text-black px-8 py-4 text-sm font-bold transition-all hover:bg-zinc-200 hover:scale-[1.02] shadow-xl"
                onClick={handleDashboardClick}
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <GoogleSignIn />
            )}
            <p className="text-xs text-zinc-500 mt-4">
              By joining, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>

        {/* Features / Social Proof */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full px-4 animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-300">
          {[
            {
              title: "Verified Identity",
              desc: "Every contractor passes a rigorous identity and background check.",
              icon: <Shield className="w-6 h-6 text-indigo-400" />,
            },
            {
              title: "Instant Booking",
              desc: "Schedule appointments instantly with real-time availability.",
              icon: <Zap className="w-6 h-6 text-purple-400" />,
            },
            {
              title: "Guaranteed Quality",
              desc: "Our satisfaction guarantee ensures your project is done right.",
              icon: <CheckCircle className="w-6 h-6 text-pink-400" />,
            },
          ].map((item, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-1"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-linear-to-r from-transparent via-white/5 to-transparent" />

              <div className="mb-4 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-white/10 text-white group-hover:scale-110 transition-transform">
                {item.icon}
              </div>

              <h3 className="text-xl font-semibold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-zinc-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
