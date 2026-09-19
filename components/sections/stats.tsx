import { Card } from "../ui/card";
import { Reveal } from "../ui/reveal";

const stats = [
  { label: "Active projects", value: "12" },
  { label: "Happy clients", value: "47" },
  { label: "Countries", value: "8" },
  { label: "Shipped MVPs", value: "23" },
];

export function Stats() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.05}>
            <Card className="p-5 text-center">
              <div className="text-3xl font-bold tracking-tight">{s.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}