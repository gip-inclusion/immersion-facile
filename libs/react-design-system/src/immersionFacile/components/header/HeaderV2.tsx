import React from "react";
import { Link } from "type-route";

export type ActionsType = {
  iconClassName: string;
  label: string;
  callback: () => void;
}[];

export type LinksType = {
  label: string;
  link: Link;
  display: boolean;
}[];

export type ImmersionPureHeaderV2Props = {
  marianneLogo: React.ReactNode;
  immersionLogo: React.ReactNode;
  actions?: ActionsType;
  links?: LinksType;
  sticky?: boolean;
};

function renderActions(actions: ActionsType) {
  return actions.map((action) => (
    <li>
      <a
        className={`fr-link ${action.iconClassName}`}
        onClick={action.callback}
        href="#"
      >
        {action.label}
      </a>
    </li>
  ));
}

function renderLinks(links: LinksType) {
  return links.map((link) => (
    <li className="fr-nav__item">
      <a className="fr-nav__link" {...link.link}>
        {link.label}
      </a>
    </li>
  ));
}

const getStickyStyles = (): object => ({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1,
});

export const HeaderV2 = ({
  actions,
  marianneLogo,
  immersionLogo,
  links,
  sticky,
}: ImmersionPureHeaderV2Props) => (
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
          <div className="fr-header__tools">
            <div className="fr-header__tools-links">
              <ul className="fr-links-group">{renderActions(actions)}</ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    {links.length > 0 && (
      <nav
        className="fr-nav fr-container"
        id="header-navigation"
        role="navigation"
        aria-label="Menu principal"
      >
        <ul className="fr-nav__list">{renderLinks(links)}</ul>
      </nav>
    )}
  </header>
);
