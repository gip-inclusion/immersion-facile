import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
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
    addressAutocompleteLocator: "createEstablishmentAddress",
  });

  const currentUser = useAppSelector(inclusionConnectedSelectors.currentUser);

  if (!currentUser) throw frontErrors.generic.unauthorized();

  const adminRight = currentUser.establishments?.find(
    (right) =>
      right.siret === currentSiret && right.role === "establishment-admin",
  );

  return (
    <section className={fr.cx("fr-grid-row", "fr-grid-row--middle")}>
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
            {adminRight ? (
              <>
                <p>
                  L'établissement <b>{adminRight.businessName}</b> est déjà
                  référencé chez nous avec ce numéro de SIRET.
                </p>
                <ButtonsGroup
                  inlineLayoutWhen="always"
                  buttons={[
                    {
                      id: domElementIds.establishment.create.startFormButton,
                      children: "Créer un nouvel établissement",
                      priority: "secondary",
                      onClick: () => onStepChange(1, []),
                    },
                    {
                      id: domElementIds.establishment.create
                        .navigateToEstablishmentDashboard,
                      priority: "primary",
                      children: "Gérer ma fiche établissement",
                      linkProps: routes.establishmentDashboard({
                        tab: "fiche-entreprise",
                      }).link,
                    },
                  ]}
                />
              </>
            ) : (
              <>
                <p>
                  L'établissement est déjà référencé chez nous avec ce numéro de
                  SIRET. Seuls les administrateurs ont accès à la fiche et aux
                  offres de l'établissement.
                </p>
                <p>
                  Accédez à votre espace pour gérer les conventions et les
                  candidatures (en fonction des droits qui vous sont attribués).
                </p>
                <Button
                  id={
                    domElementIds.establishment.create
                      .navigateToEstablishmentDashboard
                  }
                  priority="primary"
                  linkProps={routes.establishmentDashboard().link}
                >
                  Accéder à mon espace
                </Button>
              </>
            )}
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
