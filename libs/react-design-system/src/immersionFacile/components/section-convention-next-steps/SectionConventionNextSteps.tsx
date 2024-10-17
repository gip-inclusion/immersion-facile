import { fr } from "@codegouvfr/react-dsfr";
import React from "react";
import { useStyles } from "tss-react/dsfr";
import Styles from "./SectionConventionNextSteps.styles";
import contactIllustration from "./img/contact.webp";
import documentsAdministratifsIllustration from "./img/documents-administratifs.webp";
import infosImportantesIllustration from "./img/infos-importantes.webp";

export const SectionConventionNextSteps = () => {
  const { cx } = useStyles();
  return (
    <section className={cx(fr.cx("fr-mt-5w", "fr-mb-10w"), Styles.root)}>
      <div className={fr.cx("fr-container")}>
        <h2 className={cx(fr.cx("fr-mb-7w", "fr-text--lg"), Styles.title)}>
          Quelles sont les prochaines étapes ?
        </h2>

        <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
          <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
            <div
              className={cx(
                fr.cx("fr-m-auto", "fr-mb-5w", "fr-pt-md-4w"),
                Styles.illustrationWrapper,
              )}
            >
              <img
                className={Styles.illustration}
                src={contactIllustration}
                alt={""}
              />
            </div>

            <p>
              1. Pensez à verifier votre boîte mail et votre dossier de spams.
            </p>
            <a
              className={fr.cx("fr-download__link", "fr-link--icon-right")}
              href="https://immersion-facile.beta.gouv.fr/aide/article/le-beneficiaire-lentreprise-ou-le-prescripteur-na-pas-recu-la-convention-a-signer-125bxxd/"
              target="_blank"
              rel="noreferrer"
            >
              Vous n'avez pas reçu l'email ?
            </a>
          </div>

          <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
            <div
              className={cx(
                fr.cx("fr-m-auto", "fr-mb-5w"),
                Styles.illustrationWrapper,
              )}
            >
              <img
                className={Styles.illustration}
                src={documentsAdministratifsIllustration}
                alt={""}
              />
            </div>

            <p>
              2. Signez électroniquement la demande de convention à partir du
              mail reçu.
            </p>
          </div>

          <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
            <div
              className={cx(
                fr.cx("fr-m-auto", "fr-mb-5w"),
                Styles.illustrationWrapper,
              )}
            >
              <img
                className={Styles.illustration}
                src={infosImportantesIllustration}
                alt={""}
              />
            </div>

            <p>
              3. Pensez également à informer les autres signataires de la
              convention qu'ils devront vérifier leur boîte mail et leur dossier
              de spams.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
