import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Feedback } from "src/app/components/feedback/Feedback";
import { WithFeedbackReplacer } from "src/app/components/feedback/WithFeedbackReplacer";
import { ConventionForm } from "src/app/components/forms/convention/ConventionForm";
import { routes } from "src/app/routes/routes";
import type { Route } from "type-route";

export const ConventionTemplatePage = ({
  route,
}: {
  route: Route<typeof routes.agencyDashboardConventionTemplate>;
}) => {
  const { fromRoute } = route.params;

  return (
    <>
      <h1>Créer un modèle de convention</h1>
      <Button
        priority="tertiary"
        iconId="fr-icon-arrow-left-line"
        linkProps={routes[fromRoute]().link}
        className={fr.cx("fr-mb-4w")}
      >
        Retour
      </Button>
      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        <WithFeedbackReplacer
          topic="convention-template"
          renderFeedback={() => {
            return <Feedback topics={["convention-template"]} />;
          }}
        >
          <ConventionForm
            internshipKind="immersion"
            mode="create-convention-template"
          />
        </WithFeedbackReplacer>
      </div>
    </>
  );
};
