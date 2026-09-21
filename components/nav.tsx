import Link from "next/link";
import { cookies } from "next/headers";
import { Layers, Github } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export async function Nav() {
  // If a client session cookie is present, the user is logged in —
  // hide the Login button and show a "Portal" shortcut instead.
  const session = (await cookies()).get("ch_session")?.value;
  const isAuthed = Boolean(session);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Layers size={18} className="text-accent" />
          <span>Client Hub</span>
        </Link>
        <div className="flex items-center gap-1 text-sm">
          <Link
            href="/admin"
            className="hidden rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-block"
          >
            Admin
          </Link>
          <a
            href="https://github.com/Mykhailo-Zhuk/client-hub"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-block"
          >
            <Github size={14} className="mr-1 inline" />
            Repo
          </a>
          {isAuthed ? (
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Portal
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-accent px-3 py-1.5 text-accent-foreground hover:opacity-90"
            >
              Login
            </Link>
          )}
          <ThemeToggle className="ml-2" />
        </div>
      </nav>
    </header>
  );
}