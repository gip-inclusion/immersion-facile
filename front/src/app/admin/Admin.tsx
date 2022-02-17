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
} from "src/shared/ImmersionApplicationDto";
import { Route } from "type-route";
import "./Admin.css";
import { ApiDataContainer } from "./ApiDataContainer";

interface AdminProps {
  route: Route<typeof routes.admin> | Route<typeof routes.agencyAdmin>;
}

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
              href="/api/extract-demande-immersion-excel"
              target="_blank"
            >
              Exporter les demandes d'immersion par agences
            </a>
          </div>

          <>
            Préremplir le formulaire de demande d'immersion avec Pole Emploi
            Connect :
          </>
          <div className="pe-connect flex justify-center">
            <a
              href="/api/login-pe-connect"
              className="button-pe-connect"
              title=""
            >
              <img
                className="icon-pe-connect"
                src="src/assets/pe-connect-barre-nav-b.svg"
                alt=""
                width="300"
                height="75"
              />
              <img
                className="icon-pe-connect-hover"
                src="src/assets/pe-connect-barre-nav-b-o.svg"
                alt=""
                width="300"
                height="75"
              />
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
                apiCall={() =>
                  immersionApplicationGateway.getAll(agency, statusFilter)
                }
              >
                {(data) => {
                  if (!data) return <p />;

                  const immersionApplications =
                    data as ImmersionApplicationDto[];
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
                          labels={validApplicationStatus}
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
