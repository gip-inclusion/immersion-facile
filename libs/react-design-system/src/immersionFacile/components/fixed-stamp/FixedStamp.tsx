import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import { Link } from "type-route";
import FixedStampStyles from "./FixedStamp.styles";

export type FixedStampProps = {
  image: JSX.Element;
  overtitle?: JSX.Element | string;
  title?: JSX.Element | string;
  subtitle?: JSX.Element | string;
  link?: Link | { href: string };
};

export const FixedStamp = ({
  image,
  title,
  subtitle,
  overtitle,
  link,
}: FixedStampProps) => {
  const { cx } = useStyles();
  return (
    <aside
      className={cx(FixedStampStyles.root)}
      role="complementary"
      aria-label="Mise en avant temporaire"
    >
      {image && (
        <div className={cx(FixedStampStyles.imageWrapper)}>{image}</div>
      )}
      <div className={cx(FixedStampStyles.content)}>
        {overtitle && (
          <span className={cx(FixedStampStyles.overtitle)}>{overtitle}</span>
        )}
        {title && (
          <span className={cx(fr.cx("fr-text--bold"), FixedStampStyles.title)}>
            {title}
          </span>
        )}
        {subtitle && (
          <span className={cx(FixedStampStyles.subtitle)}>{subtitle}</span>
        )}
      </div>
      {link && (
        <a
          className={cx(FixedStampStyles.overlayLink)}
          {...link}
          aria-label="Lien associé à la mise en avant temporaire"
        />
      )}
    </aside>
  );
};
