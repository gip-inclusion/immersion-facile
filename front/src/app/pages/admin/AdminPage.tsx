import React, { useEffect, useState } from "react";
import { ImmersionMarianneHeader } from "src/app/components/ImmersionMarianneHeader";
import { immersionApplicationGateway } from "src/app/config/dependencies";
import { routes } from "src/app/routing/routes";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { featureFlagsSelector } from "src/core-logic/domain/featureFlags/featureFlags.selector";
import { AgencyId } from "src/shared/agency/agency.dto";
import { EstablishmentExportConfigDto } from "src/shared/establishmentExport/establishmentExport.dto";
import {
  ApplicationStatus,
  ImmersionApplicationDto,
  validApplicationStatus,
} from "src/shared/ImmersionApplication/ImmersionApplication.dto";
import {
  exportEstablismentsExcelRoute,
  exportImmersionApplicationsExcelRoute,
} from "src/shared/routes";
import { queryParamsAsString } from "src/shared/utils/queryParams";
import { ArrayDropdown } from "src/uiComponents/admin/ArrayDropdown";
import { FormAccordion } from "src/uiComponents/admin/FormAccordion";
import { FormMagicLinks } from "src/uiComponents/admin/FormMagicLinks";
import { Route } from "type-route";
import "./Admin.css";

interface AdminProps {
  route: Route<typeof routes.admin> | Route<typeof routes.agencyAdmin>;
}

const buildExportEstablishmentRoute = (params: EstablishmentExportConfigDto) =>
  `/api/${exportEstablismentsExcelRoute}?${queryParamsAsString<EstablishmentExportConfigDto>(
    params,
  )}`;

export const AdminPage = ({ route }: AdminProps) => {
  const featureFlags = useAppSelector(featureFlagsSelector);
  const [immersionApplications, setImmersionApplications] = useState<
    ImmersionApplicationDto[]
  >([]);

  const [statusFilter, setStatusFilter] = useState<
    ApplicationStatus | undefined
  >();

  const agency =
    "agencyId" in route.params
      ? (route.params.agencyId as AgencyId)
      : undefined;

  const filterChanged = (selectedIndex: number, _selectedLabel: string) => {
    setImmersionApplications([]);
    setStatusFilter(validApplicationStatus[selectedIndex]);
  };

  useEffect(() => {
    immersionApplicationGateway
      .getAll(agency, statusFilter)
      .then((applications) => setImmersionApplications(applications));
  }, [statusFilter]);

  return (
    <>
      <ImmersionMarianneHeader />

      <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
        <div className="fr-col-lg-8 fr-p-2w" style={{ width: "95%" }}>
          <div>
            <div
              style={{
                fontWeight: "600",
                fontSize: "36px",
                marginBottom: "30px",
              }}
            >
              Export de données
            </div>
            <a
              className="fr-link"
              href={`/api/${exportImmersionApplicationsExcelRoute}`}
              target="_blank"
            >
              Exporter les demandes d'immersion par agences
            </a>
            <br />
            <a
              className="fr-link"
              href={buildExportEstablishmentRoute({
                aggregateProfession: "true",
                groupKey: "region",
                sourceProvider: "all",
              })}
              target="_blank"
            >
              Exporter toutes les entreprises référencées par région avec
              aggrégation des métiers
            </a>
            <br />
            <a
              className="fr-link"
              href={buildExportEstablishmentRoute({
                aggregateProfession: "true",
                groupKey: "department",
                sourceProvider: "all",
              })}
              target="_blank"
            >
              Exporter toutes les entreprises référencées par département avec
              aggrégation des métiers
            </a>
            <br />
            <a
              className="fr-link"
              href={buildExportEstablishmentRoute({
                aggregateProfession: "false",
                groupKey: "region",
                sourceProvider: "all",
              })}
              target="_blank"
            >
              Exporter toutes les entreprises référencées par région sans
              aggrégation des métiers
            </a>
            <br />
            <a
              className="fr-link"
              href={buildExportEstablishmentRoute({
                aggregateProfession: "false",
                groupKey: "department",
                sourceProvider: "all",
              })}
              target="_blank"
            >
              Exporter toutes les entreprises référencées par département sans
              aggrégation des métiers
            </a>
            <br />
            <a
              className="fr-link"
              href={buildExportEstablishmentRoute({
                aggregateProfession: "true",
                groupKey: "region",
                sourceProvider: "cci",
              })}
              target="_blank"
            >
              Exporter les entreprises référencées par la cci (region) avec
              aggrégation des métiers
            </a>
            <br />
            <a
              className="fr-link"
              href={buildExportEstablishmentRoute({
                aggregateProfession: "true",
                groupKey: "region",
                sourceProvider: "unJeuneUneSolution",
              })}
              target="_blank"
            >
              Exporter les entreprises référencées par unJeuneUneSolution
              (region) avec aggrégation des métiers
            </a>
          </div>

          {featureFlags.enableAdminUi && (
            <div>
              <div
                style={{
                  fontWeight: "600",
                  fontSize: "36px",
                  marginBottom: "30px",
                }}
              >
                Demandes d'immersions à traiter
              </div>
              <div>
                {
                  <>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: "30px",
                        backgroundColor: "#E5E5F4",
                        padding: "10px",
                      }}
                    >
                      <p>filtres</p>
                      <ArrayDropdown
                        labels={[...validApplicationStatus]}
                        didPick={filterChanged}
                      />
                    </div>

                    <ul className="fr-accordions-group">
                      {immersionApplications.map((item) => (
                        <li key={item.id}>
                          <FormAccordion immersionApplication={item} />
                          {route.name === "admin" && (
                            <FormMagicLinks immersionApplication={item} />
                          )}
                          <hr />
                        </li>
                      ))}
                    </ul>
                  </>
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
