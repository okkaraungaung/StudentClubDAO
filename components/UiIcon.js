export default function UiIcon({ name, size = 20, className = "" }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: "1.8",
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    "aria-hidden": "true",
  };

  switch (name) {
    case "brand":
      return (
        <svg {...common} className={className}>
          <path d="M12 3.75 5.75 7.5v5.1c0 4.03 2.58 7.51 6.25 8.65 3.67-1.14 6.25-4.62 6.25-8.65V7.5L12 3.75Z" />
          <path d="M8.35 11.75c1.02-1.28 2.33-2.05 3.65-2.05s2.63.77 3.65 2.05" />
          <path d="M8.85 15.1c1.1.7 2.28 1.05 3.15 1.05s2.05-.35 3.15-1.05" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common} className={className}>
          <path d="M5 7h14" />
          <path d="M5 12h14" />
          <path d="M5 17h14" />
        </svg>
      );
    case "treasury":
      return (
        <svg {...common} className={className}>
          <path d="M4.5 10h15" />
          <path d="M6.5 10v8.5h11V10" />
          <path d="M12 5.2 18.2 9H5.8L12 5.2Z" />
          <path d="M9 10V8.6a3 3 0 0 1 6 0V10" />
        </svg>
      );
    case "members":
      return (
        <svg {...common} className={className}>
          <path d="M8.2 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M16.4 12.2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
          <path d="M3.8 20a5.6 5.6 0 0 1 8.7 0" />
          <path d="M13.6 20a4.6 4.6 0 0 1 6.6 0" />
        </svg>
      );
    case "fee":
      return (
        <svg {...common} className={className}>
          <circle cx="12" cy="12" r="7.2" />
          <path d="M9.6 10.2c.4-.9 1.4-1.5 2.4-1.5 1.4 0 2.5.8 2.5 1.8 0 2.2-4.9 1.7-4.9 4 0 1.1 1.1 1.9 2.4 1.9 1.1 0 2-.4 2.6-1.3" />
          <path d="M12 8v8" />
        </svg>
      );
    case "profile":
      return (
        <svg {...common} className={className}>
          <circle cx="12" cy="8.7" r="3.6" />
          <path d="M4.8 19.2a7.2 7.2 0 0 1 14.4 0" />
        </svg>
      );
    case "edit":
      return (
        <svg {...common} className={className}>
          <path d="M4.5 19.5h4l10-10a1.8 1.8 0 0 0 0-2.5l-.5-.5a1.8 1.8 0 0 0-2.5 0l-10 10v4Z" />
          <path d="M13.5 6.5 17.5 10.5" />
        </svg>
      );
    case "deposit":
      return (
        <svg {...common} className={className}>
          <path d="M5 8.5h14" />
          <path d="M5 12h10" />
          <path d="M5 15.5h14" />
          <path d="M16 4.8v7.2" />
          <path d="M12.4 8.5H19.6" />
        </svg>
      );
    case "activity":
      return (
        <svg {...common} className={className}>
          <path d="M5 17h14" />
          <path d="M7 13.5 10 10.5 12.5 13 17 8.5" />
          <path d="M17 8.5h-3.2" />
          <path d="M17 8.5V11.7" />
        </svg>
      );
    case "quick":
      return (
        <svg {...common} className={className}>
          <path d="M13 3.5 6.5 13h4l-1 7.5 7-9h-4L13 3.5Z" />
        </svg>
      );
    case "vote":
      return (
        <svg {...common} className={className}>
          <path d="M7 8h10v10H7z" />
          <path d="M9 4.8h6l1 3.2H8l1-3.2Z" />
          <path d="M9.2 13.2 11.2 15l3.6-4" />
        </svg>
      );
    case "execute":
      return (
        <svg {...common} className={className}>
          <path d="M6.5 12h8" />
          <path d="M11 7.5 17.5 12 11 16.5" />
        </svg>
      );
    case "document":
      return (
        <svg {...common} className={className}>
          <path d="M7 4.5h6l4 4v11H7z" />
          <path d="M13 4.5V9h4" />
          <path d="M9.5 12.2h5" />
          <path d="M9.5 15h5" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common} className={className}>
          <path d="M7 4.8v2.7" />
          <path d="M17 4.8v2.7" />
          <path d="M5.5 8.8h13" />
          <path d="M6.5 6.5h11v12H6.5z" />
          <path d="M9 12h2.5" />
          <path d="M9 15.2h5.2" />
        </svg>
      );
    case "check":
      return (
        <svg {...common} className={className}>
          <circle cx="12" cy="12" r="7.2" />
          <path d="m9.2 12.3 1.9 1.9 3.7-4" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common} className={className}>
          <circle cx="12" cy="12" r="7.2" />
          <path d="M12 8.6v4l2.7 1.8" />
        </svg>
      );
    case "gear":
      return (
        <svg {...common} className={className}>
          <path d="M10.7 3.8h2.6l.4 2.2c.5.2 1 .4 1.5.7l2-1.2 1.8 1.8-1.2 2c.3.5.5 1 .7 1.5l2.2.4v2.6l-2.2.4c-.2.5-.4 1-.7 1.5l1.2 2-1.8 1.8-2-1.2c-.5.3-1 .5-1.5.7l-.4 2.2h-2.6l-.4-2.2c-.5-.2-1-.4-1.5-.7l-2 1.2-1.8-1.8 1.2-2c-.3-.5-.5-1-.7-1.5l-2.2-.4v-2.6l2.2-.4c.2-.5.4-1 .7-1.5l-1.2-2 1.8-1.8 2 1.2c.5-.3 1-.5 1.5-.7l.4-2.2Z" />
          <circle cx="12" cy="12" r="2.8" />
        </svg>
      );
    case "remove":
      return (
        <svg {...common} className={className}>
          <circle cx="12" cy="12" r="7.2" />
          <path d="M9.2 9.2 14.8 14.8" />
          <path d="M14.8 9.2 9.2 14.8" />
        </svg>
      );
    default:
      return (
        <svg {...common} className={className}>
          <circle cx="12" cy="12" r="7.2" />
        </svg>
      );
  }
}
