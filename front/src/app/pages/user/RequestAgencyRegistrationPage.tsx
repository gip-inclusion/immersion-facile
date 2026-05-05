import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { Loader, MainWrapper, PageHeader } from "react-design-system";
import { Breadcrumbs } from "src/app/components/Breadcrumbs";
import { Feedback } from "src/app/components/feedback/Feedback";
import { RegisterAgenciesForm } from "src/app/components/forms/register-agencies/RegisterAgenciesForm";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";

export const RequestAgencyRegistrationPage = () => {
  const currentUser = useAppSelector(connectedUserSelectors.currentUser);
  const isLoading = useAppSelector(connectedUserSelectors.isLoading);
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
        className={fr.cx("fr-mb-8w")}
        pageHeader={
          <PageHeader
            title={"Demander l'accès à des organismes"}
            breadcrumbs={<Breadcrumbs />}
            badge={
              <Button
                linkProps={routes.myProfile().link}
                priority={"secondary"}
                size="small"
                className={fr.cx("fr-mb-6w")}
                iconId="fr-icon-arrow-go-back-line"
              >
                Retourner sur mon profil
              </Button>
            }
          >
            Bonjour {currentUser.firstName} {currentUser.lastName}, recherchez
            un organisme afin d'accéder aux conventions et statistiques de ce
            dernier. Un administrateur vérifiera et validera votre demande.
          </PageHeader>
        }
      >
        <Feedback topics={["dashboard-agency-register-user"]} closable />
        <RegisterAgenciesForm currentUser={currentUser} />
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
