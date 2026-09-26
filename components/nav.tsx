import Link from "next/link";
import { cookies } from "next/headers";
import { Layers } from "lucide-react";
import { NavLinks } from "./nav-links";

export async function Nav() {
  const session = (await cookies()).get("ch_session")?.value;
  const isAuthed = Boolean(session);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Layers size={18} className="text-accent" />
          <span>Client Hub</span>
        </Link>
        <NavLinks isAuthed={isAuthed} />
      </nav>
    </header>
  );
}