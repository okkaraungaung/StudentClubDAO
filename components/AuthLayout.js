export default function AuthLayout({
  eyebrow,
  title,
  description,
  highlights = [],
  panelEyebrow,
  panelTitle,
  panelDescription,
  children,
}) {
  return (
    <div className="auth-shell">
      <section className="dashboard-hero auth-hero">
        <div className="hero-copy">
          {eyebrow ? <p className="hero-eyebrow">{eyebrow}</p> : null}
          <h1 className="hero-title">{title}</h1>
          <p className="hero-text">{description}</p>

          {highlights.length ? (
            <div className="hero-badges">
              {highlights.map((item) => (
                <span
                  className={`hero-badge${item.soft ? " hero-badge-soft" : ""}`}
                  key={item.label}
                >
                  {item.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="hero-panel">
          <div className="card auth-card">
            {panelEyebrow ? (
              <p className="auth-card-eyebrow">{panelEyebrow}</p>
            ) : null}
            <h2 className="auth-card-title">{panelTitle}</h2>
            {panelDescription ? (
              <p className="muted auth-card-copy">{panelDescription}</p>
            ) : null}
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}
