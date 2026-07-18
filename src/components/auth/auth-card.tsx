import { YarnBall } from "@/components/decor";

/** Casca comum das telas de conta (entrar, cadastrar, senhas): card centrado no tema do site. */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 pb-20">
      <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-soft">
        <div className="mb-6 text-center">
          <YarnBall className="mx-auto size-8 text-primary" />
          <h1 className="mt-3 font-heading text-2xl font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
