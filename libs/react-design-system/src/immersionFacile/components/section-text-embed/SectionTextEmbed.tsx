import React from "react";
import "./SectionTextEmbed.scss";

type SectionTextEmbedProps = {
  videoUrl: string;
};
const componentName = "im-section-text-embed";

export const SectionTextEmbed = ({ videoUrl }: SectionTextEmbedProps) => (
  <section className={`fr-container ${componentName} fr-py-8w`}>
    <div className={`${componentName}__header fr-mb-4w`}>
      <h3 className={`${componentName}__title`}>
        Qu’est-ce qu’une immersion professionnelle ?
      </h3>
      <span className={`${componentName}__subtitle fr-badge im-badge fr-mb-2w`}>
        PMSPM ou Période de mise en situation en milieu professionnel
      </span>
    </div>

    <div className={`${componentName}__content`}>
      <ul className={`${componentName}__list`}>
        <li className={`${componentName}__item`}>
          <strong>L’immersion est une période courte et non rémunérée</strong>{" "}
          en entreprise.
        </li>
        <li className={`${componentName}__item`}>
          <strong>Vous conservez votre statut initial</strong> et restez couvert
          par un prescripteur (Pôle emploi, Cap Emploi, Mission Locale, etc.)
          grâce à la signature d’une convention.
        </li>
        <li className={`${componentName}__item`}>
          <strong>Il est obligatoire d'avoir une convention validée</strong>{" "}
          pour démarrer une immersion.
        </li>
        <li className={`${componentName}__item`}>
          <strong>Vous pouvez être accompagné</strong> à chacune de ces étapes
          par votre conseiller emploi habituel. C’est lui qui validera avec vous
          la convention. Vous ne le connaissez pas ? Pas de souci, nous saurons
          l’identifier.
        </li>
      </ul>
      <div className={`${componentName}__embed-wrapper`}>
        <iframe src={videoUrl} className={`${componentName}__embed`}></iframe>
      </div>
    </div>
  </section>
);
