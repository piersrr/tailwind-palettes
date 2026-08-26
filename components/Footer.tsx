export function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-5 py-6 md:px-8">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()}
        </p>
        <a
          href="https://piers.cc"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          piers.cc
        </a>
      </div>
    </footer>
  );
}
