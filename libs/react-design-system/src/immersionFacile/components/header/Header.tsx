import React from "react";
import { NavLink, NavWrapper, TabLinks } from "../tabLinks";

export type Tool = {
  iconClassName: string;
  label: string;
  callback: () => void;
};

const navWrapperOptions: NavWrapper = {
  role: "navigation",
  id: "main-menu",
  className: "fr-nav fr-nav--main fr-container",
  ariaLabel: "Menu principal",
};

const Tool = ({ tool }: { tool: Tool }) => (
  <li>
    <a className={tool.iconClassName} onClick={tool.callback} href="#">
      {tool.label}
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

export type ImmersionPureHeaderProps = {
  marianneLogo: React.ReactNode;
  immersionLogo: React.ReactNode;
  tools?: Tool[];
  navLinks?: NavLink[];
  sticky?: boolean;
};

export const Header = ({
  tools,
  marianneLogo,
  immersionLogo,
  navLinks,
  sticky,
}: ImmersionPureHeaderProps) => (
  <header className={`fr-header`} style={sticky ? getStickyStyles() : {}}>
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
              <p className="fr-header__service-title">Immersion Facilitée</p>
              <p className="fr-header__service-tagline">
                Faciliter la réalisation des immersions professionnelles
              </p>
            </div>
          </div>
          {tools && tools?.length > 0 && (
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
    {navLinks && navLinks.length > 0 && (
      <TabLinks navLinks={navLinks} navWrapper={navWrapperOptions} />
    )}
  </header>
);
