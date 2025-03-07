import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import React from "react";
import { domElementIds, toFormatedTextSiret } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useSiretFetcher } from "src/app/hooks/siret.hooks";
import { frontErrors } from "src/app/pages/error/front-errors";
import { routes } from "src/app/routes/routes";
import formIntroIllustration from "src/assets/img/form-establishment-intro.webp";

import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import { OnStepChange } from "../EstablishmentForm";

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
    <section className={fr.cx("fr-grid-row", "fr-grid-row--center")}>
      <div className={fr.cx("fr-col-lg-6", "fr-col-12")}>
        <p>Bienvenue !</p>
        {siretRawError ===
        "Establishment with this siret is already in our DB" ? (
          <>
            <p>
              Vous avez sélectionné le SIRET{" "}
              <b>{toFormatedTextSiret(currentSiret)}</b> lors de la création de
              votre compte sur ProConnect.
            </p>
            <p>
              Un établissement est déjà référencé chez nous avec ce numéro de
              SIRET.
            </p>
            <Button
              priority="primary"
              children="Accéder à mon espace"
              linkProps={{
                ...routes.establishmentDashboard({ tab: "conventions" }).link,
                id: domElementIds.establishment.create
                  .navigateToEstablishmentDashboard,
              }}
            />
          </>
        ) : (
          <>
            <p>
              Ce formulaire vous permet d’apparaître sur notre annuaire
              d’entreprises accueillantes. Ainsi, les candidats pourront vous
              trouver et vous contacter au rythme qui vous convient.
            </p>

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
          </>
        )}
      </div>
      <div className={fr.cx("fr-col-lg-6")}>
        <img src={formIntroIllustration} alt="exemple de recherche" />
      </div>
    </section>
  );
};
