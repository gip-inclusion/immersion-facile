import React from "react";

export const MarianneHeader = () => (
  <>
    <header role="banner" className="fr-header">
      <div className="fr-header__body">
        <div className="fr-container">
          <div className="fr-header__body-row">
            <div className="fr-header__brand fr-enlarge-link">
              <div className="fr-header__brand-top">
                <div className="fr-header__logo">
                  <p className="fr-logo">
                    République
                    <br />
                    Française
                  </p>
                </div>
              </div>
              <div className="fr-header__service">
                <p className="fr-header__service-title">Immersion Facile</p>
                <p className="fr-header__service-tagline">
                  Faciliter la réalisations des immersions professionnelles
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  </>
);
