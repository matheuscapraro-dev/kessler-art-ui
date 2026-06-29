import { AnimatedStitch } from "@/components/motion/animated-stitch";

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 pb-6 text-center md:pt-16">
      <h1 className="font-heading text-4xl font-semibold md:text-5xl">{title}</h1>
      {subtitle && (
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground text-pretty">{subtitle}</p>
      )}
      <div className="mx-auto mt-5 w-32">
        <AnimatedStitch />
      </div>
    </div>
  );
}
