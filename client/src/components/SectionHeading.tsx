interface Props {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
}

export function SectionHeading({ id, eyebrow, title, subtitle }: Props) {
  return (
    <div className="section-heading" data-reveal>
      <p className="section-heading__eyebrow" aria-hidden="true">
        {eyebrow}.
      </p>
      <h2 id={id}>{title}</h2>
      {subtitle && <p className="section-heading__subtitle">{subtitle}</p>}
    </div>
  );
}
