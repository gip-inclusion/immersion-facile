import { FrIconClassName, fr } from "@codegouvfr/react-dsfr";
import React from "react";
import { useStyles } from "tss-react/dsfr";
import { Link } from "type-route";
import { UserType, heroHeaderComponentName } from "../hero-header";
import Styles from "./NavCard.styles";

export type HeroHeaderNavCard = {
  title: string;
  icon?: FrIconClassName;
  overtitle?: string;
  type: UserType;
  link?: Link;
  total?: number;
  id: string;
  wrapperClassName?: string;
};

export const NavCard = ({
  title,
  icon,
  overtitle,
  link,
  type,
  total,
  id,
  wrapperClassName = heroHeaderComponentName,
}: HeroHeaderNavCard) => {
  const { cx } = useStyles();
  return (
    <div
      className={cx(
        `${wrapperClassName}__nav-card-wrapper`,
        "fr-col-12",
        `fr-col-lg-${total ? 12 / total : 4}`,
      )}
    >
      <div
        className={cx(
          Styles.root,
          `${Styles.root}--${type}`,
          `${wrapperClassName}__nav-card`,
          `${wrapperClassName}__nav-card--${type}`,
        )}
      >
        <a
          {...link}
          id={id}
          className={cx(Styles.link, `${wrapperClassName}__nav-card-link`)}
        >
          <span className={fr.cx("fr-sr-only")}>{title}</span>
        </a>
        <span
          className={cx(
            Styles.overtitle,
            `${wrapperClassName}__nav-card-overtitle`,
          )}
        >
          {overtitle}
        </span>
        {icon && (
          <span
            className={cx(
              Styles.icon,
              `${wrapperClassName}__nav-card-icon`,
              icon,
            )}
          />
        )}
        <h3 className={cx(Styles.title, `${wrapperClassName}__nav-card-title`)}>
          {title}
        </h3>
      </div>
    </div>
  );
};
