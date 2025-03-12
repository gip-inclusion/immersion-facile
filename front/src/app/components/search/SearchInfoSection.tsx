import { fr } from "@codegouvfr/react-dsfr";

import illustration from "src/assets/img/search.svg";

export const SearchInfoSection = () => (
  <section
    className={fr.cx(
      "fr-container",
      "fr-grid-row",
      "fr-grid-row--center",
      "fr-pb-9w",
    )}
  >
    <div className={fr.cx("fr-col-lg-8", "fr-col-12", "fr-pr-4w")}>
      <h2>
        Le saviez-vous ? En février 2024, il fallait envoyer en moyenne 3
        candidatures pour obtenir 1 réponse !
      </h2>
      <p>
        Les entreprises ne répondent pas à 100% des sollicitations, cela n’a
        rien à voir avec vous, ne vous découragez pas !
      </p>
    </div>
    <div className={fr.cx("fr-col-lg-4")}>
      <img src={illustration} alt="" />
    </div>
  </section>
);
