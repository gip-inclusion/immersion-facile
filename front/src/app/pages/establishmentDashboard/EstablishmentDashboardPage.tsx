import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Tabs from "@codegouvfr/react-dsfr/Tabs";
import React from "react";
import { Loader } from "react-design-system";
import { useDispatch } from "react-redux";
import { EstablishmentRole, InclusionConnectedUser } from "shared";
import { MetabaseView } from "src/app/components/MetabaseView";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { ManageConventionFormSection } from "src/app/pages/admin/ManageConventionFormSection";
import { routes } from "src/app/routes/routes";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import { P, match } from "ts-pattern";
import { Route } from "type-route";
import { ManageDiscussionFormSection } from "./ManageDiscussionFormSection";

type EstablishmentDashboardTab = {
  label: string;
  content: JSX.Element;
};

const currentUserRoleToDisplay = (role: EstablishmentRole) =>
  role === "establishment-representative"
    ? "responsable d'entreprise"
    : "tuteur de l'entreprise";

export const EstablishmentDashboardPage = ({
  route,
}: {
  route: Route<typeof routes.establishmentDashboard>;
}) => {
  const currentUser = useAppSelector(inclusionConnectedSelectors.currentUser);
  const isLoading = useAppSelector(inclusionConnectedSelectors.isLoading);
  const dispatch = useDispatch();

  const establishmentDashboardTabs = (
    currentUser: InclusionConnectedUser,
  ): EstablishmentDashboardTab[] => [
    {
      label: "Conventions en cours",
      content: (
        <>
          {currentUser.establishmentDashboards.conventions?.role ===
            "establishment-representative" && (
            <ManageConventionFormSection
              routeNameToRedirectTo={"manageConventionInclusionConnected"}
            />
          )}
          {currentUser.establishmentDashboards.conventions ? (
            <MetabaseView
              title={`Tableau des conventions en cours
            pour le ${currentUserRoleToDisplay(
              currentUser.establishmentDashboards.conventions.role,
            )} ${currentUser.firstName} ${currentUser.lastName}`}
              url={currentUser.establishmentDashboards.conventions.url}
            />
          ) : (
            <p>
              {" "}
              Nous n'avons pas trouvé de convention où vous êtes référencés en
              tant que responsable ou tuteur d'entreprise.
            </p>
          )}
        </>
      ),
    },
    {
      label: "Mises en relation",
      content: (
        <>
          <ManageDiscussionFormSection />
          {currentUser.establishmentDashboards.discussions ? (
            <MetabaseView
              title={`Suivi des mises en relations pour ${currentUser.firstName} ${currentUser.lastName}`}
              url={currentUser.establishmentDashboards.discussions}
            />
          ) : (
            <p>
              {" "}
              Nous n'avons pas trouvé de mises en relation où vous êtes
              référencés en tant que contact d'entreprise.
            </p>
          )}
        </>
      ),
    },
  ];

  return (
    <>
      <div className={fr.cx("fr-grid-row")}>
        <h1>Bienvenue</h1>
        <div className={fr.cx("fr-ml-auto", "fr-mt-1w")}>
          <Button
            onClick={() => {
              dispatch(
                authSlice.actions.federatedIdentityDeletionTriggered(
                  route.name,
                ),
              );
            }}
            type="button"
            priority="secondary"
          >
            Se déconnecter
          </Button>
        </div>
      </div>
      {isLoading && <Loader />}
      {match({ currentUser })
        .with(
          {
            currentUser: P.not(P.nullish),
          },
          ({ currentUser }) => (
            <Tabs tabs={establishmentDashboardTabs(currentUser)} />
          ),
        )
        .otherwise(() => (
          <Alert
            severity="error"
            title="Vous n'êtes pas connecté avec Inclusion Connect."
          />
        ))}
    </>
  );
};
