import { Link } from "react-router-dom";
import lifestyle from "@/assets/lifestyle-workspace.jpg";
import { Button } from "@/components/ui/button";

const About = () => (
  <div>
    <section className="container-editorial py-20 md:py-28">
      <div className="grid gap-10 lg:grid-cols-[1fr,1.1fr] lg:gap-20">
        <div>
          <span className="eyebrow">Our story</span>
          <h1 className="mt-3 font-display text-5xl font-medium leading-[1] tracking-tightest md:text-7xl">
            Made for the
            <br />
            long working life.
          </h1>
        </div>
        <div className="space-y-5 text-base leading-relaxed text-muted-foreground">
          <p>
            ForgeDesk began with a frustration. We worked from desks for ten hours a day and
            couldn't find objects we wanted to keep for ten years. So we made them.
          </p>
          <p>
            Today we work with workshops in Portugal, Germany, and Vietnam — small teams who
            cared about their craft long before we found them. Each piece is made in batches small
            enough that we know who built it.
          </p>
          <p>
            We don't release dozens of products a season. We release one, sometimes two, when
            they're right. The rest of the time we listen to the people who already own them.
          </p>
        </div>
      </div>
    </section>

    <section className="border-y border-border bg-surface">
      <div className="container-editorial py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr,1fr] lg:items-center">
          <div className="aspect-[4/3] overflow-hidden bg-background">
            <img src={lifestyle} alt="A considered desk setup" className="h-full w-full object-cover" loading="lazy" />
          </div>
          <div>
            <span className="eyebrow">Principles</span>
            <h2 className="mt-3 font-display text-4xl font-medium tracking-tightest">
              How we decide.
            </h2>
            <ul className="mt-8 space-y-6 text-sm leading-relaxed">
              {[
                {
                  t: "Materials before features.",
                  b: "We start with the material. Anything else is decoration.",
                },
                {
                  t: "Repairable over disposable.",
                  b: "If we can't replace the parts that wear, we don't make it.",
                },
                {
                  t: "Less, more carefully.",
                  b: "We restock slowly on purpose. Limited runs aren't marketing.",
                },
              ].map((p) => (
                <li key={p.t}>
                  <p className="font-display text-lg">{p.t}</p>
                  <p className="mt-1 text-muted-foreground">{p.b}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section className="container-editorial py-20 text-center">
      <h2 className="font-display text-4xl font-medium tracking-tightest md:text-5xl">
        Build a desk you'll keep.
      </h2>
      <Button asChild size="lg" className="mt-8">
        <Link to="/build">Build your setup</Link>
      </Button>
    </section>
  </div>
);

export default About;
