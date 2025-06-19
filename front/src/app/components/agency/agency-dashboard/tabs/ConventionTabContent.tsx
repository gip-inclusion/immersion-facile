import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { useState } from "react";
import { HeadingSection } from "react-design-system";
import { createPortal } from "react-dom";
import {
  type AgencyDtoForAgencyUsersAndAdmins,
  type AgencyId,
  domElementIds,
  miniStageAgencyKinds,
  type WithAgencyDashboards,
  type WithEstablishmentDashboards,
} from "shared";
import { routes } from "src/app/routes/routes";
import { MetabaseView } from "../../../MetabaseView";
import { SelectConventionFromIdForm } from "../../../SelectConventionFromIdForm";

const selectAgencyToInitiateConventionModal = createModal({
  isOpenedByDefault: false,
  id: domElementIds.agencyDashboard.dashboard
    .selectAgencyToInitiateConventionModal,
});
export const ConventionTabContent = ({
  dashboards,
  activeAgencies,
}: {
  dashboards: WithAgencyDashboards & WithEstablishmentDashboards;
  activeAgencies: AgencyDtoForAgencyUsersAndAdmins[];
}) => {
  const [selectedAgency, setSelectedAgency] = useState<AgencyId | null>(null);

  const redirectToConventionPage = (
    agency: AgencyDtoForAgencyUsersAndAdmins,
  ) => {
    if (miniStageAgencyKinds.includes(agency.kind)) {
      routes
        .conventionMiniStage({
          agencyDepartment: agency.address.departmentCode,
          agencyKind: agency.kind,
          agencyId: agency.id,
        })
        .push();
      return;
    }

    routes
      .conventionImmersion({
        agencyDepartment: agency.address.departmentCode,
        agencyKind: agency.kind,
        agencyId: agency.id,
        skipIntro: true,
      })
      .push();
  };

  const onInitiateConventionButtonClick = () => {
    if (activeAgencies.length === 1) {
      redirectToConventionPage(activeAgencies[0]);
    } else {
      selectAgencyToInitiateConventionModal.open();
    }
  };
  return (
    <HeadingSection
      titleAs="h2"
      title="Piloter une convention"
      className={fr.cx("fr-mt-0")}
      titleAction={
        <Button
          id={domElementIds.agencyDashboard.dashboard.initiateConventionButton}
          priority="primary"
          iconId="fr-icon-add-line"
          onClick={onInitiateConventionButtonClick}
        >
          Initier une convention
        </Button>
      }
    >
      <SelectConventionFromIdForm routeNameToRedirectTo="manageConventionConnectedUser" />
      <MetabaseView
        title="Tableau de bord agence"
        subtitle="Cliquer sur l'identifiant de la convention pour y accéder."
        url={dashboards.agencies.agencyDashboardUrl}
      />
      {createPortal(
        <selectAgencyToInitiateConventionModal.Component
          title="Initier une convention"
          buttons={[
            {
              doClosesModal: true,
              children: "Fermer",
            },
            {
              id: domElementIds.agencyDashboard.dashboard
                .initiateConventionModalButton,
              doClosesModal: false,
              children: "Initier la convention",
              disabled: !selectedAgency,
              onClick: () => {
                if (selectedAgency) {
                  const foundAgency = activeAgencies.find(
                    (agency) => agency.id === selectedAgency,
                  );

                  if (foundAgency) {
                    redirectToConventionPage(foundAgency);
                  }
                }
              },
            },
          ]}
        >
          Créer une convention depuis votre espace vous permet de la pré-remplir
          avec vos informations. Sélectionnez l’organisme pour lequelle vous
          souhaitez initier la convention.
          <Select
            label={"Organisme"}
            className={fr.cx("fr-mt-2w")}
            options={[
              ...activeAgencies.map((agency) => ({
                value: agency.id,
                label: `${agency.name}`,
              })),
            ]}
            placeholder="Mes organismes"
            nativeSelectProps={{
              defaultValue: "",
              value: selectedAgency ?? undefined,
              onChange: (event) => {
                setSelectedAgency(event.currentTarget.value);
              },
            }}
          />
        </selectAgencyToInitiateConventionModal.Component>,
        document.body,
      )}
    </HeadingSection>
  );
};
