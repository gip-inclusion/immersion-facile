import React, { useState } from "react";
import { immersionApplicationGateway } from "src/app/dependencies";
import { useFeatureFlagsContext } from "src/app/FeatureFlagContext";
import { routes } from "src/app/routes";
import { ArrayDropdown } from "src/components/admin/ArrayDropdown";
import { FormAccordion } from "src/components/admin/FormAccordion";
import { FormMagicLinks } from "src/components/admin/FormMagicLinks";
import { MarianneHeader } from "src/components/MarianneHeader";
import { AgencyId } from "src/shared/agencies";
import {
  ApplicationStatus,
  ImmersionApplicationDto,
  validApplicationStatus,
} from "src/shared/ImmersionApplication/ImmersionApplication.dto";
import { Route } from "type-route";
import "./Admin.css";
import { ApiDataContainer } from "./ApiDataContainer";
import {
  exportEstablismentsExcelRoute,
  exportImmersionApplicationsExcelRoute,
} from "../../shared/routes";
import { EstablishmentExportConfigDto } from "../../shared/establishmentExport/establishmentExport.dto";
import { keys } from "ramda";
import { queryParamsAsString } from "../../shared/utils/queryParams";

interface AdminProps {
  route: Route<typeof routes.admin> | Route<typeof routes.agencyAdmin>;
}

const buildExportEstablishmentRoute = (params: EstablishmentExportConfigDto) =>
  `/api/${exportEstablismentsExcelRoute}?${queryParamsAsString<EstablishmentExportConfigDto>(
    params,
  )}`;

export const Admin = ({ route }: AdminProps) => {
  const featureFlags = useFeatureFlagsContext();
  const [immersionApplications, setImmersionApplications] = useState<
    ImmersionApplicationDto[]
  >([]);

  const [statusFilter, setStatusFilter] = useState<
    ApplicationStatus | undefined
  >();

  let agency =
    "agencyId" in route.params
      ? (route.params.agencyId as AgencyId)
      : undefined;

  const filterChanged = (selectedIndex: number, selectedLabel: string) => {
    setImmersionApplications([]);
    setStatusFilter(validApplicationStatus[selectedIndex]);
  };

  return (
    <>
      <MarianneHeader />

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
                aggregateProfession: true,
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
                aggregateProfession: true,
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
                aggregateProfession: false,
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
                aggregateProfession: false,
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
                aggregateProfession: true,
                groupKey: "region",
                sourceProvider: "cci",
              })}
              target="_blank"
            >
              Exporter les entreprises référencées par la cci (region) avec
              aggrégation des métiers
            </a>
            <a
              className="fr-link"
              href={buildExportEstablishmentRoute({
                aggregateProfession: true,
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
              <ApiDataContainer
                callApi={() =>
                  immersionApplicationGateway.getAll(agency, statusFilter)
                }
              >
                {(immersionApplications) => {
                  if (!immersionApplications) return <p />;

                  return (
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
                  );
                }}
              </ApiDataContainer>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
