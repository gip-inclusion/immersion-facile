import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import React from "react";
import { domElementIds, toFormatedTextSiret } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useSiretFetcher } from "src/app/hooks/siret.hooks";
import { frontErrors } from "src/app/pages/error/front-errors";
import { routes } from "src/app/routes/routes";
import { commonIllustrations } from "src/assets/img/illustrations";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import type { OnStepChange } from "../EstablishmentForm";

export const CreateIntroSection = ({
  onStepChange,
}: {
  onStepChange: OnStepChange;
}) => {
  const { siretRawError, currentSiret } = useSiretFetcher({
    shouldFetchEvenIfAlreadySaved: false,
  });

  const currentUser = useAppSelector(inclusionConnectedSelectors.currentUser);

  if (!currentUser) throw frontErrors.generic.unauthorized();

  return (
    <section className={fr.cx("fr-grid-row", "fr-grid-row--middle")}>
      <div className={fr.cx("fr-col-lg-6", "fr-col-12")}>
        <p>Bienvenue !</p>
        <p>
          Ce formulaire vous permet d’apparaître sur notre annuaire
          d’entreprises accueillantes. Ainsi, les candidats pourront vous
          trouver et vous contacter au rythme qui vous convient.
        </p>
        {siretRawError ===
          "Establishment with this siret is already in our DB" && (
          <Alert
            className={fr.cx("fr-my-4w")}
            severity="info"
            small
            title={`L'établissement ${toFormatedTextSiret(currentSiret)} est déjà référencé sur Immersion Facilitée`}
            description={`Si vous souhaitez l'éditer, vous pouvez vous rendre sur votre tableau de bord entreprise. Si vous souhaitez ajouter un autre établissement, vous pouvez poursuivre en cliquant sur le bouton ci-dessous.`}
          />
        )}
        <Button
          iconId="fr-icon-arrow-right-line"
          iconPosition="right"
          onClick={() => onStepChange(1, [])}
          id={domElementIds.establishment.create.startFormButton}
        >
          Commencer le référencement
        </Button>
        <p className={fr.cx("fr-mt-2w")}>
          <a {...routes.conventionImmersion().link}>
            Ou remplir une demande de convention sans me référencer
          </a>
        </p>
      </div>
      <div
        className={fr.cx(
          "fr-col-12",
          "fr-col-lg-6",
          "fr-hidden",
          "fr-unhidden-lg",
          "fr-px-12w",
          "fr-py-4w",
        )}
      >
        <img src={commonIllustrations.annuaireDesEntreprises} alt="" />
      </div>
    </section>
  );
};
