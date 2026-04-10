"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Calendar, DollarSign, LayoutDashboard, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jovens", label: "Jovens", icon: Users },
  { href: "/eventos", label: "Eventos", icon: Calendar },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}

      <aside
        className={cn(
          "sidebar",
          open ? "sidebar--open" : "sidebar--closed"
        )}
      >
        {/* Logo */}
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <div className="rounded-lg">
              <Image
                src="/img/logo-512.png"
                alt="Logo Verbo da Vida"
                width={40}
                height={40}
                className="sidebar__logo-img"
              />
            </div>
            <div>
              <p className="sidebar__title">Ministério de Jovens</p>
              <p className="sidebar__subtitle">Verbo da Vida</p>
            </div>
          </div>
          <button onClick={onClose} className="sidebar__close-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar__nav">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "sidebar__link",
                  active
                    ? "sidebar__link--active"
                    : "sidebar__link--inactive"
                )}
              >
                <Icon className="sidebar__link-icon" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <p className="sidebar__footer-text">© {new Date().getFullYear()} Verbo da Vida</p>
        </div>
      </aside>
    </>
  );
}
