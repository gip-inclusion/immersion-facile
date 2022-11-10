import React, { useEffect, useState } from "react";
import { Link } from "type-route";
import "./HeroHeader.scss";

type UserType = "default" | "candidate" | "establishment" | "agency";

export type HeroHeaderProps = {
  title: string;
  description?: string;
  illustration?: string;
  icon?: string;
  typeDisplayName: string;
  type: UserType;
  parallax?: boolean;
  patterns?: boolean;
  navCards?: HeroHeaderNavCard[];
  siretModal: JSX.Element;
};
export type HeroHeaderNavCard = {
  title: string;
  icon?: string;
  overtitle?: string;
  type: UserType;
  link?: Link;
};

const componentName = "im-hero-header";

export const HeroHeader = ({
  title,
  description,
  illustration,
  type,
  patterns,
  navCards,
  parallax,
  siretModal,
  icon,
  typeDisplayName,
}: HeroHeaderProps) => {
  const [windowScrollY, setWindowScrollY] = useState<number>(window.scrollY);
  const onWindowScroll = () => {
    setWindowScrollY(window.scrollY);
  };
  const getParallaxStyle = (coeff: number) => ({
    top: `-${windowScrollY / coeff}px`,
  });
  useEffect(() => {
    const parallaxListener = () => onWindowScroll();
    if (parallax) {
      window.addEventListener("scroll", parallaxListener);
    }
    return window.removeEventListener("scroll", () => parallaxListener);
  }, []);
  return (
    <section
      className={`${componentName} ${componentName}--${type} fr-pt-8w fr-pb-2w`}
    >
      <div className={`fr-container ${componentName}__container`}>
        <div className={`${componentName}__text-wrapper`}>
          {type !== "default" && (
            <div className={`${componentName}__type-wrapper fr-mb-2w`}>
              <span className={`${componentName}__type-icon ${icon}`}></span>
              <span className={`${componentName}__type-label`}>
                {typeDisplayName}
              </span>
            </div>
          )}
          <h1 className={`${componentName}__title fr-display--xs`}>{title}</h1>
          {description && (
            <h2 className={`${componentName}__description fr-text--xl`}>
              {description}
            </h2>
          )}
        </div>

        {illustration && (
          <div className={`${componentName}__illustration-wrapper`}>
            <img
              src={illustration}
              alt="illustration immersion facilitée"
              className={`${componentName}__illustration`}
              style={parallax ? getParallaxStyle(5) : undefined}
            />
          </div>
        )}
        {patterns && (
          <div className={`${componentName}__patterns`}>
            {Array.from(Array(3).entries()).map((_item, index) => (
              <div
                key={`${componentName}__pattern--${index}`}
                className={`${componentName}__pattern ${componentName}__pattern--${index}`}
              ></div>
            ))}
          </div>
        )}
      </div>
      {navCards && navCards.length > 0 && (
        <div className={`${componentName}__nav-cards-wrapper fr-container`}>
          <nav
            className={`${componentName}__nav-cards fr-grid-row fr-grid-row--gutters`}
            aria-labelledby={`${componentName}__nav-cards-label`}
          >
            <h3 id={`${componentName}__nav-cards-label`} className="fr-hidden">
              Parcours utilisateur : candidat, entreprise, prescripteur
            </h3>
            {navCards.map((card) => (
              <NavCard {...card} key={`${card.type}-${card.title}`} />
            ))}
          </nav>
        </div>
      )}
      {siretModal}
    </section>
  );
};

const NavCard = ({ title, icon, overtitle, link, type }: HeroHeaderNavCard) => (
  <div className={`${componentName}__nav-card-wrapper fr-col-12 fr-col-lg-4`}>
    <div
      className={`${componentName}__nav-card ${componentName}__nav-card--${type}`}
    >
      <a {...link} className={`${componentName}__nav-card-link`}></a>
      <span className={`${componentName}__nav-card-overtitle`}>
        {overtitle}
      </span>
      {icon && (
        <span className={`${componentName}__nav-card-icon ${icon}`}></span>
      )}
      <h3 className={`${componentName}__nav-card-title`}>{title}</h3>
    </div>
  </div>
);
