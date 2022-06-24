import React, { useEffect, useState } from "react";
import { ArrayDropdown, DsfrTitle } from "react-design-system/immersionFacile";
import { AgencyId } from "shared/src/agency/agency.dto";
import {
  ConventionReadDto,
  allConventionStatuses,
  ConventionStatus,
} from "shared/src/convention/convention.dto";
import { conventionGateway } from "src/app/config/dependencies";
import { AdminRoute } from "src/app/pages/admin/AdminRoute";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { ConventionFormAccordion } from "src/uiComponents/admin/ConventionFormAccordion";
import { FormMagicLinks } from "src/uiComponents/admin/FormMagicLinks";
import { WithBackground } from "src/uiComponents/admin/WithBackground";
import "./Admin.css";

export const ConventionTab = ({ route }: { route: AdminRoute }) => {
  const adminToken = useAppSelector(adminSelectors.token);
  const [conventions, setConventions] = useState<ConventionReadDto[]>([]);

  const [statusFilter, setStatusFilter] = useState<
    ConventionStatus | undefined
  >();

  const agency =
    "agencyId" in route.params
      ? (route.params.agencyId as AgencyId)
      : undefined;

  const filterChanged = (selectedConventionStatus?: ConventionStatus) => {
    setConventions([]);
    if (selectedConventionStatus) setStatusFilter(selectedConventionStatus);
  };

  useEffect(() => {
    conventionGateway
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .getAll(adminToken!, agency, statusFilter)
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
                options={[...allConventionStatuses]}
                onSelect={filterChanged}
                allowEmpty={false}
                defaultSelectedOption={"IN_REVIEW"}
              />
            </div>
          </WithBackground>

          <ul className="fr-accordions-group">
            {conventions.map((item) => (
              <li key={item.id}>
                <ConventionFormAccordion convention={item} />
                {route.name === "admin" && <FormMagicLinks convention={item} />}
                <hr />
              </li>
            ))}
          </ul>
        </>
      }
    </div>
  );
};
