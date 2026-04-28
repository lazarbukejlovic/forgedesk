import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const sections: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: "Shipping",
    items: [
      {
        q: "Where do you ship?",
        a: "Worldwide. Most orders are produced and dispatched within 2 business days from our Lisbon studio.",
      },
      {
        q: "How long does delivery take?",
        a: "EU 2–4 business days · UK 3–5 · US & Canada 4–7 · Rest of world 5–10. Tracking is sent the moment your order ships.",
      },
      {
        q: "Is shipping free?",
        a: "Yes on orders over $200. Below that, we charge a flat $12 worldwide.",
      },
    ],
  },
  {
    title: "Returns & warranty",
    items: [
      {
        q: "What is your return policy?",
        a: "Thirty days, unused, in original packaging. We pay return shipping for any defect; otherwise it's on us above $200, on you below.",
      },
      {
        q: "Do you offer a warranty?",
        a: "A lifetime craftsmanship guarantee. If something we made fails through normal use, we repair or replace it.",
      },
    ],
  },
  {
    title: "Materials & care",
    items: [
      {
        q: "How do I care for the leather mat?",
        a: "Dust regularly with a dry microfibre. Condition once a year with a neutral leather balm. The patina is the point.",
      },
      {
        q: "Are your woods sustainably sourced?",
        a: "All hardwoods are FSC-certified. Off-cuts go to a local toy maker. We publish a transparency report each year.",
      },
    ],
  },
];

const FAQ = () => (
  <div>
    <header className="border-b border-border bg-surface py-16 md:py-24">
      <div className="container-editorial">
        <span className="eyebrow">Help</span>
        <h1 className="mt-3 font-display text-4xl font-medium leading-[1] tracking-tightest md:text-6xl">
          Shipping, returns,
          <br />
          and the small things.
        </h1>
      </div>
    </header>

    <div className="container-editorial grid gap-16 py-16 lg:grid-cols-[260px,1fr]">
      <nav className="text-sm">
        <ul className="space-y-2">
          {sections.map((s) => (
            <li key={s.title}>
              <a href={`#${s.title}`} className="text-muted-foreground hover:text-foreground">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-14">
        {sections.map((s) => (
          <section key={s.title} id={s.title}>
            <h2 className="font-display text-3xl tracking-tightest md:text-4xl">{s.title}</h2>
            <Accordion type="single" collapsible className="mt-4">
              {s.items.map((item) => (
                <AccordionItem key={item.q} value={item.q}>
                  <AccordionTrigger className="text-left font-display text-base">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
      </div>
    </div>
  </div>
);

export default FAQ;
