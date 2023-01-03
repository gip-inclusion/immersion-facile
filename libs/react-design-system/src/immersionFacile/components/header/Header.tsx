import React, { useState } from "react";
import { NavLink, NavWrapper, TabLinks } from "../tabLinks";

export type Tool = {
  iconClassName: string;
  label: string;
  callback: () => void;
};

const navWrapperOptions: NavWrapper = {
  role: "navigation",
  id: "modal-header__menu-inner",
  className: "fr-header__menu",
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
}: ImmersionPureHeaderProps) => {
  const [isOpened, setIsOpened] = useState(false);
  const onMenuMobileToggleClick = () => {
    setIsOpened((openState) => !openState);
  };
  return (
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
                <div className="fr-header__navbar">
                  <button
                    aria-controls="modal-header__menu"
                    aria-haspopup="menu"
                    title="Afficher le menu"
                    className="fr-btn--menu fr-btn"
                    onClick={onMenuMobileToggleClick}
                    type="button"
                  >
                    Menu
                  </button>
                </div>
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
        <div
          id="modal-header__menu"
          className={`fr-header__menu fr-modal ${
            isOpened ? "fr-modal--opened" : ""
          }`}
        >
          <div className="fr-container">
            <button
              aria-controls="modal-header__menu"
              className="fr-btn fr-btn--close"
              onClick={onMenuMobileToggleClick}
            >
              Fermer
            </button>
            <TabLinks navLinks={navLinks} navWrapper={navWrapperOptions} />
          </div>
        </div>
      )}
    </header>
  );
};
