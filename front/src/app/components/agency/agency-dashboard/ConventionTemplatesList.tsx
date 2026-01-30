import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { HeadingSection, Task } from "react-design-system";
import { domElementIds } from "shared";
import { routes } from "src/app/routes/routes";
import type { Route } from "type-route";

export const ConventionTemplatesList = ({
  fromRoute,
}: {
  fromRoute: Route<
    typeof routes.agencyDashboard | typeof routes.establishmentDashboard
  >;
}) => {
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
            routes.conventionTemplate({ fromRoute: fromRoute.name }).link
          }
        >
          Créer un nouveau modèle
        </Button>
      }
    >
      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-mt-1w")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
          <Task
            title="Convention Job Dating de Paris"
            titleAs="h4"
            description="7 partages / 3 utilisations"
            hasBackgroundColor={true}
            footer="Mise à jour : 29/10/2025 à 16h00"
            buttonsRows={[
              {
                id: "edit-delete",
                content: (
                  <>
                    <Button
                      key={
                        domElementIds.agencyDashboard.conventionTemplates
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
                        domElementIds.agencyDashboard.conventionTemplates
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
                      domElementIds.agencyDashboard.conventionTemplates
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
        <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
          <Task
            title="Mes modèles de conventions 2"
            titleAs="h3"
            description="Mes modèles de conventions"
            hasBackgroundColor={true}
          />
        </div>
      </div>
    </HeadingSection>
  );
};
