import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { initialFrom } from "../lib/dao";
import UiIcon from "./UiIcon";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    badge: null,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    ),
  },
  {
    href: "/proposals",
    label: "Proposals",
    badge: "3",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
      />
    ),
  },
  {
    href: "/fees",
    label: "Fees",
    badge: null,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  {
    href: "/admin",
    label: "Admin",
    badge: null,
    hiddenWhenNoAccess: true,
    icon: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </>
    ),
  },
];

export default function DashboardLayout({
  title,
  navUser = "Member",
  profileName,
  showAdmin = false,
  actions = null,
  children,
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const displayName = profileName || navUser || "Member";
  const avatar = initialFrom(displayName);

  return (
    <div className="dashboard-shell">
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`} id="sidebar">
        <div className="sidebar-brand">
          <h1>
            <span className="logo-icon">
              <UiIcon name="brand" size={18} />
            </span>
            Student Club DAO
          </h1>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">Menu</div>
          {NAV_ITEMS.map((item) => {
            const hidden = item.hiddenWhenNoAccess && !showAdmin;
            const isActive = router.pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item${isActive ? " active" : ""}${hidden ? " hidden" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <svg
                  className="nav-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {item.icon}
                </svg>
                {item.label}
                {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
              </Link>
            );
          })}
          <div className="nav-section">Account</div>
          <Link href="/" className="nav-item" onClick={() => setSidebarOpen(false)}>
            <svg
              className="nav-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </Link>
        </nav>
        <div className="sidebar-footer">
          <div className="user-pill">
            <div className="user-avatar" id="miniAvatar">
              {avatar}
            </div>
            <div className="user-info">
              <div className="user-name" id="miniName">
                {displayName}
              </div>
              <div className="user-role" id="navUser">
                {navUser}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div
        className={`overlay${sidebarOpen ? " show" : ""}`}
        id="overlay"
        onClick={() => setSidebarOpen(false)}
      />

      <div className="main">
        <div className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-toggle"
              type="button"
              onClick={() => setSidebarOpen((value) => !value)}
              aria-label="Toggle sidebar"
            >
              <UiIcon name="menu" size={18} />
            </button>
            <h2 className="page-title">{title}</h2>
          </div>
          {actions ? <div className="top-actions">{actions}</div> : null}
        </div>

        <div className="content">{children}</div>
      </div>
    </div>
  );
}
