import React from "react";
import { routes } from "src/app/routes";
import immersionFacileLogo from "src/assets/Logo-immersion-facilitee-01-RVB-reflets-crop.svg";

export const LinkHome: React.FC<{ className?: string }> = ({
  children,
  className,
}) => (
  <a {...routes.home().link} className={className}>
    {children}
  </a>
);

export const MarianneLogo = () => (
  <LinkHome>
    <div className="fr-header__brand-top">
      <div className="fr-header__logo">
        <p className="fr-logo">
          République
          <br />
          Française
        </p>
      </div>
    </div>
  </LinkHome>
);

export const MarianneHeader = () => (
  <section
    className="flex justify-between px-3 "
    style={{ boxShadow: "0 4px 2px -2px silver" }}
  >
    <div>
      <MarianneLogo />
      <div className="pb-1 text-xs font-light">
        Faciliter la réalisation des immersions professionnelles
      </div>
    </div>

    <div
      className="flex flex-wrap justify-center"
      style={{ minWidth: "100px" }}
    >
      <LinkHome className="w-full h-full shadow-none">
        <img src={immersionFacileLogo} alt="Logo Immersion-Facile" />
      </LinkHome>
    </div>
  </section>
);
