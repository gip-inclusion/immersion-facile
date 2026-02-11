import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { useEffect } from "react";
import { HeadingSection, Loader, Task } from "react-design-system";
import { useDispatch, useSelector } from "react-redux";
import { domElementIds } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { conventionTemplateSelectors } from "src/core-logic/domain/convention-template/conventionTemplate.selectors";
import { conventionTemplateSlice } from "src/core-logic/domain/convention-template/conventionTemplate.slice";
import type { Route } from "type-route";

export const ConventionTemplatesList = ({
  fromRoute,
}: {
  fromRoute: Route<
    typeof routes.agencyDashboard | typeof routes.establishmentDashboard
  >;
}) => {
  const dispatch = useDispatch();
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);
  const isLoading = useSelector(conventionTemplateSelectors.isLoading);
  const conventionTemplates = useSelector(
    conventionTemplateSelectors.conventionTemplates,
  );

  useEffect(() => {
    if (connectedUserJwt) {
      dispatch(
        conventionTemplateSlice.actions.fetchConventionTemplatesRequested({
          jwt: connectedUserJwt,
          feedbackTopic: "convention-template",
        }),
      );
    }
  }, [connectedUserJwt, dispatch]);

  return (
    <HeadingSection
      title="Mes modèles de conventions"
      titleAs="h3"
      className={fr.cx("fr-mt-4w")}
      titleAction={
        <Button
          id={domElementIds.agencyDashboard.dashboard.initiateConventionButton}
          priority="primary"
          iconId="fr-icon-add-line"
          linkProps={
            routes.agencyDashboardConventionTemplate({
              fromRoute: fromRoute.name,
            }).link
          }
        >
          Créer un nouveau modèle
        </Button>
      }
    >
      {isLoading && <Loader />}
      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-mt-1w")}>
        {conventionTemplates.length === 0 && (
          <div className={fr.cx("fr-col-12")}>
            <p>Vous n’avez pas encore de modèle de convention.</p>
            <p>
              Les modèles vous permettent de gagner du temps lorsque vous devez
              préparer plusieurs immersions similaires (job dating avec une même
              entreprise, plusieurs immersions pour un même candidat, etc.)
            </p>
            <p>
              Créez votre premier modèle pour pré-remplir automatiquement les
              informations qui reviennent souvent, et partagez-le facilement
              avec les personnes en immersion ou les entreprises.
            </p>
          </div>
        )}
        {conventionTemplates.map((template) => (
          <div key={template.id} className={fr.cx("fr-col-12", "fr-col-lg-6")}>
            <Task
              title={template.name}
              titleAs="h4"
              description={template.internshipKind}
              hasBackgroundColor={true}
              buttonsRows={[
                {
                  id: "edit-delete",
                  content: (
                    <>
                      <Button
                        key={
                          domElementIds.agencyDashboard.conventionTemplate
                            .editConventionTemplateButton
                        }
                        priority="tertiary"
                        iconId="fr-icon-edit-line"
                        iconPosition="right"
                      >
                        Modifier
                      </Button>
                      <Button
                        key={
                          domElementIds.agencyDashboard.conventionTemplate
                            .deleteConventionTemplateButton
                        }
                        priority="tertiary"
                        iconId="fr-icon-delete-bin-line"
                        title="Supprimer"
                      />
                    </>
                  ),
                },
                {
                  id: "share",
                  content: (
                    <Button
                      key={
                        domElementIds.agencyDashboard.conventionTemplate
                          .shareConventionTemplateButton
                      }
                      priority="tertiary no outline"
                      iconId="fr-icon-send-plane-line"
                      iconPosition="right"
                    >
                      Partager
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        ))}
      </div>
    </HeadingSection>
  );
};
