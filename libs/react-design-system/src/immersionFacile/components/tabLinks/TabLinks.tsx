import React from "react";

export type NavLink = {
  onClick?: () => void;
  label: string;
  href: string;
  active?: boolean;
  target?: string;
};

export type NavWrapper = {
  role: string;
  id: string;
  className?: string;
  ariaLabel: string;
  style?: React.CSSProperties;
};

const TabLink = ({ href, onClick, active, label }: NavLink) => (
  <li className="fr-nav__item">
    <a
      className="fr-nav__link"
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}>
      {label}
    </a>
  </li>
);

export const TabLinks = ({
  navLinks,
  navWrapper,
}: {
  navLinks: NavLink[];
  navWrapper: NavWrapper;
}) => (
  <nav
    className={`fr-nav ${navWrapper.className}`}
    id={navWrapper.id}
    role={navWrapper.role}
    aria-label={navWrapper.ariaLabel}
    style={navWrapper.style}>
    <ul className="fr-nav__list">
      {navLinks.map((link, index) => (
        <TabLink {...link} key={index} />
      ))}
    </ul>
  </nav>
);
