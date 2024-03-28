import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import React from "react";
import { domElementIds } from "shared";
import { routes } from "src/app/routes/routes";
import formIntroIllustration from "src/assets/img/form-establishment-intro.webp";
import { Mode, OnStepChange } from "../EstablishmentForm";

export const IntroSection = ({
  onStepChange,
  mode,
}: {
  onStepChange: OnStepChange;
  mode: Mode;
}) => (
  <section className={fr.cx("fr-grid-row", "fr-grid-row--center")}>
    <div className={fr.cx("fr-col-lg-6", "fr-col-12")}>
      {mode === "create" && (
        <>
          <p>Bienvenue !</p>
          <p>
            Ce formulaire vous permet d’apparaître sur notre annuaire
            d’entreprises accueillantes. Ainsi, les candidats pourront vous
            trouver et vous contacter au rythme qui vous convient.
          </p>
        </>
      )}
      {mode === "edit" && (
        <>
          <p>
            Ce formulaire vous permet de modifier la façon dont vous apparaissez
            sur notre annuaire d’entreprises destiné aux candidats. Ils pourront
            vous trouver et vous contacter au rythme qui vous convient.
          </p>
        </>
      )}

      <Button
        iconId="fr-icon-arrow-right-line"
        iconPosition="right"
        onClick={() => onStepChange(1, [])}
        id={domElementIds.establishment[mode].startFormButton}
      >
        {mode === "create"
          ? "Commencer le référencement"
          : "Éditer mon entreprise"}
      </Button>
      <p className={fr.cx("fr-mt-2w")}>
        <a {...routes.conventionImmersion()}>
          Ou remplir une demande de convention sans me référencer
        </a>
      </p>
    </div>
    <div className={fr.cx("fr-col-lg-6")}>
      <img src={formIntroIllustration} alt="" />
    </div>
  </section>
);
