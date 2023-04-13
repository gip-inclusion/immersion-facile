import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useStyles } from "tss-react/dsfr";

import "./SectionFaq.scss";

export type SectionFaqProps = {
  articles: FaqCardProps[];
};

const componentName = "im-section-faq";
export const SectionFaq = ({ articles }: SectionFaqProps) => {
  const { cx } = useStyles();
  return (
    <section className={cx(componentName)}>
      <div
        className={cx(
          fr.cx(
            "fr-container",
            "fr-py-8w",
            "fr-grid-row",
            "fr-grid-row--center",
          ),
          `${componentName}__container`,
        )}
      >
        <h2 className={cx(fr.cx("fr-mb-6w"), `${componentName}__title`)}>
          Questions fréquentes
        </h2>
        {articles && articles.length > 0 && (
          <nav
            className={cx(
              fr.cx("fr-grid-row", "fr-grid-row--gutters"),
              `${componentName}__items`,
            )}
          >
            {articles.map((article, index) => (
              <FaqCard
                key={`section-faq-item-${index}`}
                {...article}
                index={index}
              />
            ))}
          </nav>
        )}

        <Button
          linkProps={{
            href: "https://aide.immersion-facile.beta.gouv.fr/fr/",
            target: "_blank",
            id: "im-section-faq__see-all-button",
          }}
          className={fr.cx("fr-mt-4w", "fr-mx-auto")}
        >
          Voir toutes les questions fréquentes
        </Button>
      </div>
    </section>
  );
};

export type FaqCardProps = {
  title: string;
  description: string;
  url: string;
  index?: number;
};

const FaqCard = ({ title, description, url, index }: FaqCardProps) => (
  <div className={fr.cx("fr-col-12", "fr-col-lg-4")}>
    <div className={fr.cx("fr-card", "fr-enlarge-link")}>
      <div className={fr.cx("fr-card__body")}>
        <div className={fr.cx("fr-card__content")}>
          <h3 className={fr.cx("fr-card__title")}>
            <a
              href={url}
              target="_blank"
              id={`im-section-faq__card-${index ? index + 1 : ""}`}
              rel="noreferrer"
            >
              {title}
            </a>
          </h3>
          <p className={fr.cx("fr-card__desc")}>{description}</p>
        </div>
      </div>
    </div>
  </div>
);
