import React, { useEffect, useState } from "react";
import { AgencyId } from "shared/src/agency/agency.dto";
import { EstablishmentExportConfigDto } from "shared/src/establishmentExport/establishmentExport.dto";
import {
  ConventionStatus,
  ConventionDto,
  allConventionStatuses,
} from "shared/src/convention/convention.dto";
import {
  exportEstablismentsExcelRoute,
  exportConventionsExcelRoute,
} from "shared/src/routes";
import { queryParamsAsString } from "shared/src/utils/queryParams";
import { ImmersionMarianneHeader } from "src/app/components/ImmersionMarianneHeader";
import { conventionGateway } from "src/app/config/dependencies";
import { routes } from "src/app/routing/routes";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
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
  const featureFlags = useFeatureFlags();
  const [conventions, setConventions] = useState<ConventionDto[]>([]);

  const [statusFilter, setStatusFilter] = useState<
    ConventionStatus | undefined
  >();

  const agency =
    "agencyId" in route.params
      ? (route.params.agencyId as AgencyId)
      : undefined;

  const filterChanged = (selectedIndex: number, _selectedLabel: string) => {
    setConventions([]);
    setStatusFilter(allConventionStatuses[selectedIndex]);
  };

  useEffect(() => {
    conventionGateway.getAll(agency, statusFilter).then(
      (applications) => setConventions(applications),
      (error: any) => {
        // eslint-disable-next-line no-console
        console.log("getFormEstablishmentFromJwt", error);
      },
    );
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
              href={`/api/${exportConventionsExcelRoute}`}
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
            <br />
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
                        labels={[...allConventionStatuses]}
                        didPick={filterChanged}
                      />
                    </div>

                    <ul className="fr-accordions-group">
                      {conventions.map((item) => (
                        <li key={item.id}>
                          <FormAccordion convention={item} />
                          {route.name === "admin" && (
                            <FormMagicLinks convention={item} />
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
