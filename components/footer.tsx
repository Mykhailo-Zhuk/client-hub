export function Footer() {
  return (
    <footer className="border-t border-border/60 py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 sm:flex-row">
        <div>
          © {new Date().getFullYear()} Client Hub · MVP by{" "}
          <a
            href="https://zhuk.dev"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Mykhailo Zhuk
          </a>
        </div>
        <div className="flex gap-4">
          <a href="/admin" className="hover:text-foreground">
            Admin
          </a>
          <a href="/agent-console" className="hover:text-foreground">
            Agent Console
          </a>
          <a href="/login" className="hover:text-foreground">
            Client Login
          </a>
        </div>
      </div>
    </footer>
  );
}