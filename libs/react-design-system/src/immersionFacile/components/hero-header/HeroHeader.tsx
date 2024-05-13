import { fr } from "@codegouvfr/react-dsfr";
import React, { useEffect, useState } from "react";
import { useStyles } from "tss-react/dsfr";
import { HeroHeaderNavCard, NavCard } from "../nav-card/NavCard";
import Styles from "./HeroHeader.styles";

export type UserType = "default" | "candidate" | "establishment" | "agency";

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

export const heroHeaderComponentName = "im-hero-header";

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
        Styles.root,
        fr.cx("fr-pt-8w", "fr-pb-2w"),
        `${Styles.root}--${type}`,
      )}
    >
      <div className={cx(fr.cx("fr-container"), Styles.container)}>
        <div className={cx(Styles.textWrapper)}>
          {type !== "default" && (
            <div className={cx(fr.cx("fr-mb-2w"), Styles.typeWrapper)}>
              <span
                className={cx(`${heroHeaderComponentName}__type-icon`, icon)}
              />
              <span className={cx(Styles.typeLabel)}>{typeDisplayName}</span>
            </div>
          )}
          <h1 className={cx(fr.cx("fr-display--xs"), Styles.title)}>{title}</h1>
          {description && (
            <h2 className={cx(fr.cx("fr-text--xl"), Styles.description)}>
              {description}
            </h2>
          )}
        </div>

        {illustration && (
          <div className={cx(Styles.illustrationWrapper)}>
            <img
              src={illustration}
              alt="illustration immersion facilitée"
              aria-hidden="true"
              className={cx(Styles.illustration)}
              style={parallax ? getParallaxStyle(5) : undefined}
            />
          </div>
        )}
        {patterns && (
          <div className={cx(Styles.patterns)}>
            {Array.from(Array(3).entries()).map((_item, index) => (
              <div
                key={`${Styles.pattern}--${index}`}
                className={cx(Styles.pattern, `${Styles.pattern}--${index}`)}
              />
            ))}
          </div>
        )}
      </div>
      {navCards && navCards.length > 0 && (
        <div className={cx(fr.cx("fr-container"), Styles.navCardsWrapper)}>
          <nav
            className={cx(
              fr.cx("fr-grid-row", "fr-grid-row--gutters"),
              Styles.navCards,
            )}
            aria-labelledby={cx(`${Styles.root}__nav-cards-label`)}
          >
            <h3
              id={`${Styles.root}__nav-cards-label`}
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
