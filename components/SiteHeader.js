import Link from "next/link";

export default function SiteHeader({ navUser = "Member", showAdmin = false }) {
  return (
    <header>
      <div className="brand">
        <h1>Student Club DAO</h1>
        <p id="navUser">{navUser}</p>
      </div>
      <nav>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/proposals">Proposals</Link>
        <Link href="/fees">Fees</Link>
        <Link href="/admin" className={showAdmin ? "" : "hidden"}>
          Admin
        </Link>
        <Link href="/">Logout</Link>
      </nav>
    </header>
  );
}
