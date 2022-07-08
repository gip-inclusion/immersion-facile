import React, { ReactNode, CSSProperties } from "react";
import { ClassName } from "../../dom/ClassName";

Header.defaultProps = {
  entityTitle: "République Française",
  operator: {
    logo: null,
    title: "Immersion Facilitée",
    baseline: "Faciliter la réalisation des immersions professionnelles",
  },
  sticky: false,
};

export type HeaderMenuItemType = {
  label: string;
  url: string;
  icon: ReactNode;
};

export type HeaderOperatorType = {
  title: string;
  baseline: string;
  logo: ReactNode;
  menuItems: HeaderMenuItemType[];
  sticky: boolean;
};

export type HeaderProperties = {
  entityTitle: string;
  additionnalClassName?: ClassName;
  classNameOverride?: ClassName;
  styleOverride?: CSSProperties;
  operator?: HeaderOperatorType;
};

export function Header({ entityTitle, operator }: HeaderProperties) {
  function spaceToBrJSX(string: string): ReactNode {
    const lines = string.split(/ /g);
    return (
      <span>
        {lines.map((line, index) => (
          <span key={index}>
            {index > 0 ? <br /> : ""}
            {line}
          </span>
        ))}
      </span>
    );
  }
  return (
    <header role="banner" className="fr-header">
      <div className="fr-header__body">
        <div className="fr-container">
          <div className="fr-header__body-row">
            <div className="fr-header__brand fr-enlarge-link">
              <div className="fr-header__brand-top">
                <div className="fr-header__logo">
                  <a href="/" title={`Accueil - ${entityTitle}`}>
                    <p className="fr-logo">{spaceToBrJSX(entityTitle)}</p>
                  </a>
                </div>
                {operator?.logo && (
                  <div className="fr-header__operator">{operator.logo}</div>
                )}
              </div>
              {operator?.title && operator?.baseline && (
                <div className="fr-header__service">
                  <a href="/" title={`Accueil - ${operator.title}}`}>
                    <p className="fr-header__service-title">{operator.title}</p>
                  </a>
                  <p className="fr-header__service-tagline">
                    {operator.baseline}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
