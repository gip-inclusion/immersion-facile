import React from "react";
import { Button } from "../buttons";
import "./SectionFaq.scss";

export type SectionFaqProps = {
  articles: Card[];
};

const componentName = "im-section-faq";
export const SectionFaq = ({ articles }: SectionFaqProps) => (
  <section className={`${componentName} fr-py-8w `}>
    <div className={`fr-container ${componentName}__container`}>
      <h3 className={`${componentName}__title fr-mb-6w`}>
        Questions fréquentes
      </h3>
      {articles && articles.length > 0 && (
        <nav
          className={`${componentName}__items fr-grid-row fr-grid-row--gutters`}
        >
          {articles.map((article, index) => (
            <FaqCard key={`section-faq-item-${index}`} {...article} />
          ))}
        </nav>
      )}
      <div className={`${componentName}__buttons-container fr-mt-4w`}>
        <Button url="https://aide.immersion-facile.beta.gouv.fr/fr/">
          Voir toutes les questions fréquentes
        </Button>
      </div>
    </div>
  </section>
);

export type FaqCardProps = {
  title: string;
  description: string;
  url: string;
};

const FaqCard = ({ title, description, url }: FaqCardProps) => (
  <div className="fr-col-12 fr-col-lg-4">
    <div className="fr-card fr-enlarge-link">
      <div className="fr-card__body">
        <div className="fr-card__content">
          <h3 className="fr-card__title">
            <a href={url} target="_blank">
              {title}
            </a>
          </h3>
          <p className="fr-card__desc">{description}</p>
        </div>
      </div>
    </div>
  </div>
);
