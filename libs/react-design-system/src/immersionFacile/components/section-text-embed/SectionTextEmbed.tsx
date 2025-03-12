import { fr } from "@codegouvfr/react-dsfr";

import ReactPlayer from "react-player";
import "./SectionTextEmbed.scss";

export type SectionTextEmbedProps = {
  videoUrl: string;
  videoPosterUrl: string;
  videoTranscription: string;
  videoDescription: string;
};
const componentName = "im-section-text-embed";

export const SectionTextEmbed = ({
  videoUrl,
  videoPosterUrl,
  videoTranscription,
  videoDescription,
}: SectionTextEmbedProps) => (
  <section className={`fr-container ${componentName} fr-pt-8w fr-pb-10w`}>
    <div className={`${componentName}__header fr-mb-4w`}>
      <h2 className={`${componentName}__title`}>
        Qu’est-ce qu’une immersion professionnelle ?
      </h2>
      <span className={`${componentName}__subtitle fr-badge fr-mb-2w`}>
        PMSMP ou Période de mise en situation en milieu professionnel
      </span>
    </div>

    <div
      className={`${componentName}__content fr-grid-row fr-grid-row--gutters`}
    >
      <ul className={`${componentName}__list fr-col-12 fr-col-md-6`}>
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
          par un prescripteur (France Travail, Cap Emploi, Mission Locale, etc.)
          grâce à la signature d’une convention.
        </li>
        <li className={`${componentName}__item`}>
          <strong>Vous pouvez être accompagné</strong> à chacune de ces étapes
          par votre conseiller emploi habituel. C’est lui qui validera avec vous
          la convention. Vous ne le connaissez pas ? Pas de souci, nous saurons
          l’identifier.
        </li>
      </ul>
      <div className={`${componentName}__embed-wrapper fr-col-12 fr-col-md-6`}>
        <h3 className={fr.cx("fr-sr-only")}>Vidéo Immersion en entreprise</h3>
        <ReactPlayer
          controls
          url={videoUrl}
          width="100%"
          height="auto"
          playing
          light={
            <img
              src={videoPosterUrl}
              alt="Vignette vidéo Immersion en entreprise"
            />
          }
          config={{
            file: {
              attributes: {
                poster: videoPosterUrl,
              },
              tracks: [
                {
                  kind: "descriptions",
                  src: videoDescription,
                  srcLang: "fr",
                  default: false,
                  label: "description-fr",
                },
              ],
            },
          }}
        />
        <a
          className={fr.cx(
            "fr-download__link",
            "fr-icon-download-line",
            "fr-link--icon-right",
          )}
          href={videoTranscription}
          aria-label="Transcription textuelle, téléchargement en format texte"
        >
          Télécharger la transcription textuelle
        </a>
      </div>
    </div>
  </section>
);
