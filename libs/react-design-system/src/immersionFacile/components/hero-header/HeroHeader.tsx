import React, { useEffect, useState } from "react";
import "./HeroHeader.scss";

type UserType = "default" | "candidate" | "establishment" | "agency";

export type HeroHeaderProps = {
  title: string;
  description?: string;
  illustration?: string;
  type: UserType;
  parallax?: boolean;
  patterns?: boolean;
  navCards?: HeroHeaderNavCard[];
};
export type HeroHeaderNavCard = {
  title: string;
  icon?: string;
  overtitle?: string;
  type: UserType;
  url: string;
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
}: HeroHeaderProps) => {
  const [windowScrollY, setWindowScrollY] = useState<number>(window.scrollY);
  const onWindowScroll = () => {
    setWindowScrollY(window.scrollY);
  };
  const getParallaxStyle = (coeff: number) => ({
    top: `-${windowScrollY / coeff}px`,
  });
  useEffect(() => {
    if (parallax) {
      window.addEventListener("scroll", () => onWindowScroll());
    }
    return window.removeEventListener("scroll", () => onWindowScroll());
  }, []);
  return (
    <section className={`${componentName} ${componentName}--${type} fr-pt-8w `}>
      <div className={`fr-container ${componentName}__container`}>
        <div className={`${componentName}__text-wrapper`}>
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
        <div className="fr-container">
          <nav
            className={`${componentName}__nav-cards fr-grid-row fr-grid-row--gutters`}
          >
            {navCards.map((card) => (
              <NavCard {...card} />
            ))}
          </nav>
        </div>
      )}
    </section>
  );
};

const NavCard = ({ title, icon, overtitle, url, type }: HeroHeaderNavCard) => (
  <div className={"fr-col-12 fr-col-lg-4"}>
    <article
      className={`${componentName}__nav-card ${componentName}__nav-card--${type}`}
    >
      <a href={url} className={`${componentName}__nav-card-link`}></a>
      <span className={`${componentName}__nav-card-overtitle`}>
        {overtitle}
      </span>
      {icon && (
        <span className={`${componentName}__nav-card-icon ${icon}`}></span>
      )}
      <h3 className={`${componentName}__nav-card-title`}>{title}</h3>
    </article>
  </div>
);
