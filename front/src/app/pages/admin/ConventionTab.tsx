import React, { useEffect, useState } from "react";
import {
  ArrayDropdown,
  DsfrTitle,
  ImmersionTextField,
} from "react-design-system/immersionFacile";
import { AgencyId } from "shared/src/agency/agency.dto";
import {
  allConventionStatuses,
  ConventionReadDto,
  ConventionStatus,
} from "shared/src/convention/convention.dto";
import { conventionGateway } from "src/app/config/dependencies";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { ConventionFormAccordion } from "src/uiComponents/admin/ConventionFormAccordion";
import { WithBackground } from "src/uiComponents/admin/WithBackground";
import "./Admin.css";

export const ConventionTab = () => {
  const adminToken = useAppSelector(adminSelectors.token);
  const [conventions, setConventions] = useState<ConventionReadDto[]>([]);

  const [statusFilter, setStatusFilter] = useState<
    ConventionStatus | undefined
  >();

  const [agencyFilter, setAgencyFilter] = useState<AgencyId | undefined>();

  const filterChanged = (
    selectedConventionStatus?: ConventionStatus | "Tous les statuts",
  ) => {
    setConventions([]);
    if (!selectedConventionStatus) return;
    if (selectedConventionStatus === "Tous les statuts") {
      setStatusFilter(undefined);
      return;
    }
    setStatusFilter(selectedConventionStatus);
  };

  useEffect(() => {
    conventionGateway
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .getAll(adminToken!, agencyFilter, statusFilter)
      .then(
        (applications) => setConventions(applications),
        (error: any) => {
          // eslint-disable-next-line no-console
          console.log("getFormEstablishmentFromJwt", error);
        },
      );
  }, [statusFilter]);

  return (
    <div>
      <DsfrTitle level={5} text="Gérer les conventions" />
      {
        <>
          <WithBackground>
            <div className="w-2/3">
              <ArrayDropdown
                label="Sélectionner un statut"
                options={["Tous les statuts", ...allConventionStatuses]}
                onSelect={filterChanged}
                allowEmpty={false}
                defaultSelectedOption={"IN_REVIEW"}
              />
              <br />
              <ImmersionTextField
                name="agencyId"
                label={
                  "Si vous souhaitez filtrer sur une agence particulière, saisissez son ID"
                }
                onChange={(e) => setAgencyFilter(e.target.value)}
              />
            </div>
          </WithBackground>

          <ul className="fr-accordions-group">
            {conventions.map((item) => (
              <li key={item.id}>
                <ConventionFormAccordion convention={item} />
                {/*<FormMagicLinks convention={item} />*/}
                <hr />
              </li>
            ))}
          </ul>
        </>
      }
    </div>
  );
};
