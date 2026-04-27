"use client";

/**
 * App shell: full-height column, safe-area for mobile dock, subtle luxe backdrop.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Info, MessageCircle, Store } from "lucide-react";
import { motion } from "framer-motion";

const dockSpring = { type: "spring" as const, stiffness: 420, damping: 34 };

const dockItems = [
  { href: "/", label: "Hjem", icon: Home },
  { href: "/shopping", label: "Shop", icon: Store },
  { href: "/about", label: "Om", icon: Info },
  { href: "/feedback", label: "Feedback", icon: MessageCircle },
] as const;

export function LumiShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#f6f4ef]">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(139,105,20,0.07),transparent_50%),radial-gradient(circle_at_100%_0%,rgba(120,113,108,0.05),transparent_42%),radial-gradient(circle_at_0%_100%,rgba(214,211,209,0.28),transparent_48%)]"
        aria-hidden
      />
      <div className="flex min-h-0 flex-1 flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t-[0.5px] border-stone-300/80 bg-[#f6f4ef]/90 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"
        aria-label="Primær navigation"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around gap-1 px-2">
          {dockItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className="flex min-h-12 min-w-[3.25rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-medium tracking-wide text-stone-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6914]/30"
              >
                <motion.span
                  whileTap={{ scale: 0.92 }}
                  transition={dockSpring}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border-[0.5px] transition-colors ${
                    active
                      ? "border-[#7c5a10]/35 bg-[#7c5a10]/10 text-[#5f4308]"
                      : "border-transparent bg-white/70 text-stone-600"
                  }`}
                >
                  <Icon size={20} strokeWidth={1.75} aria-hidden />
                </motion.span>
                <span className={active ? "text-stone-900" : ""}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
