export default function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <header className="hero">
      <div className="hero__content">
        {eyebrow && <span className="hero__eyebrow">{eyebrow}</span>}
        <h1 className="hero__title">{title}</h1>
        {subtitle && <p className="hero__sub">{subtitle}</p>}
      </div>
      {children && <div className="hero__stats">{children}</div>}
    </header>
  );
}

export function Stat({ value, label }) {
  return (
    <div className="stat">
      <div className="stat__value">{value}</div>
      <div className="stat__label">{label}</div>
    </div>
  );
}