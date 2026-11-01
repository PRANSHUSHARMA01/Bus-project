"use client";

export interface CarouselCardItem {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  bg: string;
  color: string;
  onClick: () => void;
}

interface CarouselProps {
  cards: CarouselCardItem[];
  title?: string;
}

export function Carousel({ cards, title = "Save yourself a trip" }: CarouselProps) {
  return (
    <div className="carousel-wrap">
      <h2 className="text-title" style={{ fontSize: 20, margin: "0 0 14px 0" }}>
        {title}
      </h2>
      <div className="carousel-snap" role="region" aria-label={title}>
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={card.onClick}
            className="carousel-card"
            style={{
              background: card.bg,
              color: card.color,
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") card.onClick();
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "rgba(255, 255, 255, 0.85)",
              }}
            >
              {card.tag}
            </span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.25, color: "#ffffff" }}>
                {card.title}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(255, 255, 255, 0.9)",
                  marginTop: 6,
                  lineHeight: 1.35,
                }}
              >
                {card.subtitle}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
