"use client";

interface PromoBannerProps {
  badge?: string;
  title: string;
  subtitle: string;
  buttonText: string;
  onButtonClick: () => void;
}

export function PromoBanner({
  badge = "DELHI GOVT SCHEME",
  title,
  subtitle,
  buttonText,
  onButtonClick,
}: PromoBannerProps) {
  return (
    <div className="promo-banner" role="region" aria-label={title}>
      <div style={{ maxWidth: "82%", position: "relative", zIndex: 2 }}>
        <span className="promo-badge">{badge}</span>
        <div className="promo-title">{title}</div>
        <p className="promo-subtitle">{subtitle}</p>
        <button onClick={onButtonClick} className="btn-white-pill">
          {buttonText}
        </button>
      </div>

      {/* Decorative concentric shapes */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          right: -24,
          bottom: -24,
          width: 150,
          height: 150,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.08)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          right: 20,
          bottom: 20,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.05)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
