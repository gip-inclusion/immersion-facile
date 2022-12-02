import React from "react";
import ReactPlayer from "react-player";
import "./SectionTextEmbed.scss";

type SectionTextEmbedProps = {
  videoUrl: string;
  videoPosterUrl: string;
};
const componentName = "im-section-text-embed";

export const SectionTextEmbed = ({
  videoUrl,
  videoPosterUrl,
}: SectionTextEmbedProps) => (
  <section className={`fr-container ${componentName} fr-pt-8w fr-pb-10w`}>
    <div className={`${componentName}__header fr-mb-4w`}>
      <h3 className={`${componentName}__title`}>
        Qu’est-ce qu’une immersion professionnelle ?
      </h3>
      <span className={`${componentName}__subtitle fr-badge im-badge fr-mb-2w`}>
        PMSMP ou Période de mise en situation en milieu professionnel
      </span>
    </div>

    <div
      className={`${componentName}__content fr-grid-row fr-grid-row--gutters`}
    >
      <ul className={`${componentName}__list fr-col-12 fr-col-lg-6`}>
        <li className={`${componentName}__item`}>
          <strong>L’immersion est une période courte et non rémunérée</strong>{" "}
          en entreprise.
        </li>

        <li className={`${componentName}__item`}>
          <strong>Il est obligatoire d'avoir une convention validée</strong>{" "}
          pour démarrer une immersion.
        </li>
        <li className={`${componentName}__item`}>
          <strong>Vous conservez votre statut initial</strong> et restez couvert
          par un prescripteur (Pôle emploi, Cap Emploi, Mission Locale, etc.)
          grâce à la signature d’une convention.
        </li>
        <li className={`${componentName}__item`}>
          <strong>Vous pouvez être accompagné</strong> à chacune de ces étapes
          par votre conseiller emploi habituel. C’est lui qui validera avec vous
          la convention. Vous ne le connaissez pas ? Pas de souci, nous saurons
          l’identifier.
        </li>
      </ul>
      <div className={`${componentName}__embed-wrapper fr-col-12 fr-col-lg-5`}>
        <ReactPlayer
          controls
          url={videoUrl}
          config={{
            file: {
              attributes: {
                poster: videoPosterUrl,
              },
            },
          }}
        />
      </div>
    </div>
  </section>
);
