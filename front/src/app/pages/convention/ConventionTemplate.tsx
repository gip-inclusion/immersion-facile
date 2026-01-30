import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { MainWrapper, PageHeader } from "react-design-system";
import { ConventionForm } from "src/app/components/forms/convention/ConventionForm";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";
import type { Route } from "type-route";

export const ConventionTemplatePage = ({
  route,
}: {
  route: Route<typeof routes.conventionTemplate>;
}) => {
  const { fromRoute } = route.params;

  return (
    <HeaderFooterLayout>
      <MainWrapper
        layout={"default"}
        vSpacing={3}
        pageHeader={
          <PageHeader
            title="Créer un modèle de convention"
            backButton={
              <Button
                priority="tertiary"
                iconId="fr-icon-arrow-left-line"
                linkProps={routes[fromRoute]().link}
                className={fr.cx("fr-mb-4w")}
              >
                Annuler
              </Button>
            }
          />
        }
      >
        <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
          <ConventionForm
            internshipKind="immersion"
            mode="create-from-scratch"
          />
        </div>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
