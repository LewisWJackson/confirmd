import React from "react";
import { useLocation } from "wouter";

interface FooterLink {
  label: string;
  href: string;
}

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "News",
    links: [
      { label: "Home", href: "/" },
      { label: "Creator Claims", href: "/creators" },
      { label: "Sources", href: "/sources" },
    ],
  },
  {
    title: "Topics",
    links: [
      { label: "Bitcoin", href: "/topics/bitcoin" },
      { label: "Ethereum", href: "/topics/ethereum" },
      { label: "DeFi", href: "/topics/defi" },
      { label: "Regulation", href: "/topics/regulation" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/about" },
      { label: "Mission", href: "/about" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/about" },
      { label: "Methodology", href: "/about" },
      { label: "Newsletter", href: "/plus" },
    ],
  },
  {
    title: "Tools",
    links: [
      { label: "Confirmd+", href: "/plus" },
      { label: "Gift", href: "/plus" },
    ],
  },
];

export const Footer: React.FC = () => {
  const [, setLocation] = useLocation();

  const navigate = (href: string) => {
    setLocation(href);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-[#1a1a1a] text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        {/* Column grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 mb-16">
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.href)}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="border-t border-gray-800 pt-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          {/* Large logo */}
          <div>
            <button
              onClick={() => navigate("/")}
              className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none hover:opacity-80 transition-opacity"
            >
              CONFIRMD
            </button>
          </div>

          {/* Copyright + social */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 text-xs text-gray-500">
            <span>&copy; 2026 Confirmd. All rights reserved.</span>
            {/* X/Twitter icon */}
            <a
              href="https://x.com/confirmd"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors"
              aria-label="Follow on X"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
