import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { Loader, MainWrapper, PageHeader } from "react-design-system";
import { Breadcrumbs } from "src/app/components/Breadcrumbs";
import { Feedback } from "src/app/components/feedback/Feedback";
import { RequestRegisterEstablishmentsForUserForm } from "src/app/components/forms/register-establishments/RequestRegisterEstablishmentsForUserForm";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";

export const RequestEstablishmentRegistrationPage = () => {
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
        vSpacing={4}
        pageHeader={
          <PageHeader
            title={"Se rattacher à une entreprise"}
            breadcrumbs={<Breadcrumbs />}
            badge={
              <Button
                linkProps={routes.myProfile().link}
                priority={"secondary"}
                className={fr.cx("fr-my-6w")}
              >
                Retourner sur mon profil
              </Button>
            }
          >
            Bonjour {currentUser.firstName} {currentUser.lastName}, recherchez
            une entreprise afin d'accéder aux offres et mises en relation de
            cette dernière. Un administrateur vérifiera et validera votre
            demande.
          </PageHeader>
        }
      >
        <Feedback
          topics={["my-profile-establishment-registration"]}
          closable
          className={fr.cx("fr-mb-2w")}
        />
        <RequestRegisterEstablishmentsForUserForm currentUser={currentUser} />
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
