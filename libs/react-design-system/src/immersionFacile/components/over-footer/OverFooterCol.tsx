import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";

export type OverFooterColProps = {
  title: string;
  subtitle: string;
  iconTitle?: string;
  link?: {
    label: string;
    url: string;
  };
  id: string;
};

export const OverFooterCol = ({
  title,
  subtitle,
  link,
  iconTitle,
}: OverFooterColProps) => {
  const { cx } = useStyles();
  return (
    <div className={fr.cx("fr-col-12", "fr-col-md")}>
      <p className={fr.cx("fr-h6")}>
        <span
          aria-hidden="true"
          className={cx(fr.cx("fr-mr-2v"), iconTitle)}
        ></span>
        {title}
      </p>
      <div>
        <div>
          {subtitle && (
            <div className={fr.cx("fr-grid-row")}>
              <div className={fr.cx("fr-col")}>
                <p>{subtitle}</p>
              </div>
            </div>
          )}

          {link && (
            <div className={fr.cx("fr-grid-row", "fr-mb-3w")}>
              <div className={fr.cx("fr-col")}>
                <a
                  href={link.url}
                  target="_blank"
                  className={fr.cx(
                    "fr-link",
                    "fr-icon-arrow-right-line",
                    "fr-link--icon-right",
                  )}
                >
                  {link.label}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
