import type { ReactNode } from "react";

export function PageIntro({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="max-w-2xl">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        {kicker}
      </p>
      <h2 className="font-serif text-[2.35rem] italic leading-[1.08] tracking-tight text-foreground md:text-5xl">
        {title}
      </h2>
      {children ? (
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          {children}
        </p>
      ) : null}
    </header>
  );
}
