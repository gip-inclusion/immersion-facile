import React, { useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
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
  total?: number;
  id: string;
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
  const { cx } = useStyles();
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
      className={cx(
        fr.cx("fr-pt-8w", "fr-pb-2w"),
        componentName,
        `${componentName}--${type}`,
      )}
    >
      <div className={cx(fr.cx("fr-container"), `${componentName}__container`)}>
        <div className={cx(`${componentName}__text-wrapper`)}>
          {type !== "default" && (
            <div
              className={cx(
                fr.cx("fr-mb-2w"),
                `${componentName}__type-wrapper`,
              )}
            >
              <span className={cx(`${componentName}__type-icon`, icon)}></span>
              <span className={cx(`${componentName}__type-label`)}>
                {typeDisplayName}
              </span>
            </div>
          )}
          <h1
            className={cx(fr.cx("fr-display--xs"), `${componentName}__title`)}
          >
            {title}
          </h1>
          {description && (
            <h2
              className={cx(
                fr.cx("fr-text--xl"),
                `${componentName}__description`,
              )}
            >
              {description}
            </h2>
          )}
        </div>

        {illustration && (
          <div className={cx(`${componentName}__illustration-wrapper`)}>
            <img
              src={illustration}
              alt="illustration immersion facilitée"
              aria-hidden="true"
              className={cx(`${componentName}__illustration`)}
              style={parallax ? getParallaxStyle(5) : undefined}
            />
          </div>
        )}
        {patterns && (
          <div className={cx(`${componentName}__patterns`)}>
            {Array.from(Array(3).entries()).map((_item, index) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={`${componentName}__pattern--${index}`}
                className={cx(
                  `${componentName}__pattern`,
                  `${componentName}__pattern--${index}`,
                )}
              ></div>
            ))}
          </div>
        )}
      </div>
      {navCards && navCards.length > 0 && (
        <div
          className={cx(
            fr.cx("fr-container"),
            `${componentName}__nav-cards-wrapper`,
          )}
        >
          <nav
            className={cx(
              fr.cx("fr-grid-row", "fr-grid-row--gutters"),
              `${componentName}__nav-cards`,
            )}
            aria-labelledby={cx(`${componentName}__nav-cards-label`)}
          >
            <h3
              id={`${componentName}__nav-cards-label`}
              className={fr.cx("fr-hidden")}
            >
              Parcours utilisateur : candidat, entreprise, prescripteur
            </h3>
            {navCards.map((card) => (
              <NavCard
                {...card}
                total={navCards.length}
                key={`${card.type}-${card.title}`}
              />
            ))}
          </nav>
        </div>
      )}
      {siretModal}
    </section>
  );
};

const NavCard = ({
  title,
  icon,
  overtitle,
  link,
  type,
  total,
  id,
}: HeroHeaderNavCard) => {
  const { cx } = useStyles();
  return (
    <div
      className={`${componentName}__nav-card-wrapper fr-col-12 fr-col-lg-${
        total ? 12 / total : 4
      }`}
    >
      <div
        className={cx(
          `${componentName}__nav-card`,
          `${componentName}__nav-card--${type}`,
        )}
      >
        <a {...link} id={id} className={cx(`${componentName}__nav-card-link`)}>
          <span className={fr.cx("fr-sr-only")}>{title}</span>
        </a>
        <span className={cx(`${componentName}__nav-card-overtitle`)}>
          {overtitle}
        </span>
        {icon && (
          <span className={cx(`${componentName}__nav-card-icon`, icon)}></span>
        )}
        <h3 className={cx(`${componentName}__nav-card-title`)}>{title}</h3>
      </div>
    </div>
  );
};
