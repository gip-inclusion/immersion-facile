import React from "react";

export type NavLink = {
  onClick?: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
  label: string;
  href?: string;
  active?: boolean;
  target?: string;
  children?: NavLink[];
  index?: number;
};

export type NavWrapper = {
  role: string;
  id: string;
  className?: string;
  ariaLabel: string;
  style?: React.CSSProperties;
};

const TabLink = ({
  href,
  onClick,
  active,
  label,
  children,
  index,
}: NavLink) => {
  const hasChildren = children && children.length > 0;
  const subMenuId = `fr-nav__sub-menu-${index}`;
  return (
    <li className="fr-nav__item">
      {hasChildren && (
        <button
          className="fr-nav__btn"
          aria-expanded="false"
          aria-controls={subMenuId}
          aria-current={active ? "page" : undefined}
        >
          {label}
        </button>
      )}
      {!hasChildren && (
        <a
          className="fr-nav__link"
          href={href}
          onClick={onClick}
          aria-current={active ? "page" : undefined}
        >
          {label}
        </a>
      )}
      {hasChildren && (
        <div className="fr-collapse fr-menu" id={subMenuId}>
          <ul className="fr-menu__list">
            {children.map((link, index) => (
              <TabLink {...link} key={index} index={index} />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
};

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
    style={navWrapper.style}
  >
    <ul className="fr-nav__list">
      {navLinks.map((link, index) => (
        <TabLink {...link} key={index} index={index} />
      ))}
    </ul>
  </nav>
);
