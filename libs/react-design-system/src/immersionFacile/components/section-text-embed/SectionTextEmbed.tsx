import React from "react";
import ReactPlayer from "react-player";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
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
}: SectionTextEmbedProps) => {
  const { cx } = useStyles();
  return (
    <section
      className={cx(
        fr.cx("fr-container", "fr-pt-8w", "fr-pb-10w"),
        componentName,
      )}
    >
      <div className={cx(fr.cx("fr-mb-4w"), `${componentName}__header`)}>
        <h2 className={cx(`${componentName}__title`)}>
          Qu’est-ce qu’une immersion professionnelle ?
        </h2>
      </div>

      <div
        className={cx(
          fr.cx("fr-grid-row", "fr-grid-row--gutters"),
          `${componentName}__content`,
        )}
      >
        <ul
          className={cx(
            fr.cx("fr-col-12", "fr-col-md-6"),
            `${componentName}__list`,
          )}
        >
          <li className={cx(`${componentName}__item`)}>
            <strong>L’immersion est une période courte et non rémunérée</strong>{" "}
            en entreprise.
          </li>

          <li className={cx(`${componentName}__item`)}>
            <strong>Il est obligatoire d'avoir une convention validée</strong>{" "}
            pour démarrer une immersion.
          </li>
          <li className={cx(`${componentName}__item`)}>
            <strong>Vous conservez votre statut initial</strong> et restez
            couvert par un prescripteur (Pôle emploi, Cap Emploi, Mission
            Locale, etc.) grâce à la signature d’une convention.
          </li>
          <li className={cx(`${componentName}__item`)}>
            <strong>Vous pouvez être accompagné</strong> à chacune de ces étapes
            par votre conseiller emploi habituel. C’est lui qui validera avec
            vous la convention. Vous ne le connaissez pas ? Pas de souci, nous
            saurons l’identifier.
          </li>
        </ul>
        <div
          className={cx(
            fr.cx("fr-col-12", "fr-col-md-6"),
            `${componentName}__embed-wrapper`,
          )}
        >
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
};
