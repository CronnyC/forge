import Link from "next/link";
import { Home, BarChart2, BookOpen, User } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-3 border-t"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <NavItem href="/dashboard" icon={<Home size={22} />} label="Home" />
        <NavItem href="/dashboard/history" icon={<BarChart2 size={22} />} label="History" />
        <NavItem href="/dashboard/programs" icon={<BookOpen size={22} />} label="Programs" />
        <NavItem href="/dashboard/profile" icon={<User size={22} />} label="Profile" />
      </nav>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all"
      style={{ color: "var(--text-muted)" }}
    >
      {icon}
      <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
    </Link>
  );
}
