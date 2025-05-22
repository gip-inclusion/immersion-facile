import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { Loader, MainWrapper, PageHeader } from "react-design-system";
import { Breadcrumbs } from "src/app/components/Breadcrumbs";
import { Feedback } from "src/app/components/feedback/Feedback";
import { RegisterAgenciesForm } from "src/app/components/forms/register-agencies/RegisterAgenciesForm";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";

export const RequestAgencyRegistrationPage = () => {
  const currentUser = useAppSelector(inclusionConnectedSelectors.currentUser);
  const isLoading = useAppSelector(inclusionConnectedSelectors.isLoading);
  if (isLoading) {
    return <Loader />;
  }
  if (!currentUser)
    return <p>Merci de vous connecter pour accéder à cette page.</p>;
  return (
    <HeaderFooterLayout>
      <MainWrapper
        layout={"default"}
        vSpacing={0}
        pageHeader={
          <PageHeader
            title={"Demander l'accès à des organismes"}
            breadcrumbs={<Breadcrumbs />}
          >
            Bonjour {currentUser.firstName} {currentUser.lastName}, recherchez
            un organisme afin d'accéder aux conventions et statistiques de ce
            dernier. Un administrateur vérifiera et validera votre demande.
          </PageHeader>
        }
      >
        <Feedback topics={["dashboard-agency-register-user"]} />
        <RegisterAgenciesForm currentUser={currentUser} />
        <div className={fr.cx("fr-my-6w")}>
          <Button
            linkProps={{
              href: `${routes.myProfile().href}`,
            }}
            priority={"secondary"}
          >
            Retourner sur mon profil
          </Button>
        </div>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
