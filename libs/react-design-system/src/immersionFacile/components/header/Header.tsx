import React from "react";
import { Link } from "type-route";

export type ToolType = {
  iconClassName: string;
  label: string;
  callback: () => void;
};

export type ToolsType = ToolType[];

export type NavLinkType = {
  link: Link;
  label: string;
  display: boolean;
  active?: boolean;
};

export type NavLinksType = NavLinkType[];

export type ImmersionPureHeaderProps = {
  marianneLogo: React.ReactNode;
  immersionLogo: React.ReactNode;
  tools?: ToolsType;
  links?: NavLinksType;
  sticky?: boolean;
};

const Tool = ({ tool }: { tool: ToolType }) => (
  <li>
    <a className={tool.iconClassName} onClick={tool.callback} href="#">
      {tool.label}
    </a>
  </li>
);

const NavLink = ({ link }: { link: NavLinkType }) => (
  <li className="fr-nav__item">
    <a
      className="fr-nav__link"
      {...link.link}
      aria-current={link.active ? "page" : undefined}
    >
      {link.label}
    </a>
  </li>
);

const getStickyStyles = (): React.CSSProperties => ({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1,
});

export const Header = ({
  tools,
  marianneLogo,
  immersionLogo,
  links,
  sticky,
}: ImmersionPureHeaderProps) => (
  <header
    role="banner"
    className={`fr-header`}
    style={sticky ? getStickyStyles() : {}}
  >
    <div className="fr-header__body">
      <div className="fr-container">
        <div className="fr-header__body-row">
          <div className="fr-header__brand fr-enlarge-link">
            <div className="fr-header__brand-top">
              {marianneLogo}
              {immersionLogo && (
                <div className="fr-header__operator">{immersionLogo}</div>
              )}
            </div>
            <div className="fr-header__service">
              <a href="/" title={`Accueil - Immersion Facilitée`}>
                <p className="fr-header__service-title">Immersion Facilitée</p>
              </a>
              <p className="fr-header__service-tagline">
                Faciliter la réalisation des immersions professionnelles
              </p>
            </div>
          </div>
          {tools && tools.length > 0 && (
            <div className="fr-header__tools">
              <div className="fr-header__tools-links">
                <ul className="fr-nav fr-nav--right">
                  {tools.map((tool, index) => (
                    <Tool tool={tool} key={index} />
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    {links && links.length > 0 && (
      <nav
        className="fr-nav fr-container"
        id="header-navigation"
        role="navigation"
        aria-label="Menu principal"
      >
        <ul className="fr-nav__list">
          {links.map((link, index) => (
            <NavLink link={link} key={index} />
          ))}
        </ul>
      </nav>
    )}
  </header>
);
