import React from "react";
import { Link } from "type-route";

export type NavLink = {
  link: Link;
  label: string;
  active?: boolean;
};

const TabLink = ({ link, active, label }: NavLink) => (
  <li className="fr-nav__item">
    <a
      className="fr-nav__link"
      {...link}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </a>
  </li>
);

export const TabLinks = ({ navLinks }: { navLinks: NavLink[] }) => (
  <ul className="fr-nav__list">
    {navLinks.map((link) => (
      <TabLink {...link} key={link.link.href} />
    ))}
  </ul>
);
