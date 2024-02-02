import { fr } from "@codegouvfr/react-dsfr";
import React from "react";
import { useStyles } from "tss-react/dsfr";
import { Link } from "type-route";
import Styles from "./FixedStamp.styles";

export type FixedStampProps = {
  image: JSX.Element;
  overtitle?: string;
  title?: string;
  subtitle?: string;
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
      className={cx(Styles.root)}
      role="complementary"
      aria-label="Mise en avant temporaire"
    >
      {image && <div className={cx(Styles.imageWrapper)}>{image}</div>}
      <div className={cx(Styles.content)}>
        {overtitle && overtitle !== "" && (
          <span className={cx(Styles.overtitle)}>{overtitle}</span>
        )}
        {title && (
          <span className={cx(fr.cx("fr-text--bold"), Styles.title)}>
            {title}
          </span>
        )}
        {subtitle && subtitle !== "" && (
          <span
            className={cx(Styles.subtitle)}
            dangerouslySetInnerHTML={{ __html: subtitle }}
          />
        )}
      </div>
      {link && link.href !== "" && (
        <a
          className={cx(Styles.overlayLink)}
          {...link}
          aria-label={subtitle || "Lien associé à la mise en avant temporaire"}
        />
      )}
    </aside>
  );
};
