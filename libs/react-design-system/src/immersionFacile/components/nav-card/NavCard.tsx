import { FrIconClassName, fr } from "@codegouvfr/react-dsfr";
import React from "react";
import { useStyles } from "tss-react/dsfr";
import { Link } from "type-route";
import { UserType, heroHeaderComponentName } from "../hero-header";
import Styles from "./NavCard.styles";

export type HeroHeaderNavCard = {
  title: React.ReactNode;
  icon?: FrIconClassName;
  overtitle?: string;
  type: UserType;
  link?: {
    href: string;
    id?: string;
    onClick?: Link["onClick"];
    target?: HTMLAnchorElement["target"];
  };
  onClick?: () => void;
  total?: number;
  id: string;
  withBorder?: boolean;
  wrapperClassName?: string;
  alternateTitle?: string;
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
  withBorder,
  onClick,
  alternateTitle,
}: HeroHeaderNavCard) => {
  const { cx } = useStyles();
  return (
    <div
      className={cx(
        `${wrapperClassName}__wrapper`,
        "fr-col",
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
          withBorder && Styles.withBorder,
        )}
      >
        {link && (
          <a
            {...link}
            id={id}
            className={cx(Styles.link, `${wrapperClassName}__nav-card-link`)}
            title={alternateTitle ?? ""}
          >
            <span className={fr.cx("fr-sr-only")}>{title}</span>
          </a>
        )}
        {onClick && (
          <button
            type="button"
            onClick={onClick}
            id={id}
            className={cx(Styles.link, `${wrapperClassName}__nav-card-link`)}
          >
            <span className={fr.cx("fr-sr-only")}>{title}</span>
          </button>
        )}

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
