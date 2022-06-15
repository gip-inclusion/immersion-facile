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
import { FormAccordion } from "src/uiComponents/admin/FormAccordion";
import { FormMagicLinks } from "src/uiComponents/admin/FormMagicLinks";

import { Route } from "type-route";
import "./Admin.css";
import { ArrayDropdown } from "react-design-system/immersionFacile";
import { Tabs, Tab } from "@dataesr/react-dsfr";

interface AdminProps {
  route: Route<typeof routes.admin> | Route<typeof routes.agencyAdmin>;
}

const buildExportEstablishmentRoute = (params: EstablishmentExportConfigDto) =>
  `/api/${exportEstablismentsExcelRoute}?${queryParamsAsString<EstablishmentExportConfigDto>(
    params,
  )}`;

export const AdminPage = ({ route }: AdminProps) => {
  const featureFlags = useFeatureFlags();

  return (
    <>
      <ImmersionMarianneHeader />

      <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
        <div className="fr-col-lg-8 fr-p-2w" style={{ width: "95%" }}>
          <Tabs className="min-h-screen">
            <Tab
              className={featureFlags.enableAdminUi ? "" : "hidden"}
              label="Conventions"
              index={0}
              activeTab={0}
            >
              <ConventionTab route={route} />
            </Tab>
            <Tab label="Export de données" index={2} activeTab={0}>
              <DataExportTab />
            </Tab>
          </Tabs>
        </div>
      </div>
    </>
  );
};

const DataExportTab = () => (
  <div className="flex flex-col gap-1">
    <Link
      title="Les conventions par agences"
      href={`/api/${exportConventionsExcelRoute}`}
    />

    <Link
      title="Les entreprises référencées par région avec aggrégation
      des métiers"
      href={buildExportEstablishmentRoute({
        aggregateProfession: true,
        groupKey: "region",
        sourceProvider: "all",
      })}
    />
    <Link
      title="Les entreprises référencées par département avec
      aggrégation des métiers"
      href={buildExportEstablishmentRoute({
        aggregateProfession: true,
        groupKey: "department",
        sourceProvider: "all",
      })}
    />
    <Link
      title="Les entreprises référencées par région sans aggrégation
      des métiers"
      href={buildExportEstablishmentRoute({
        aggregateProfession: false,
        groupKey: "region",
        sourceProvider: "all",
      })}
    />
    <Link
      title="Les entreprises référencées par la cci (region) avec aggrégation
      des métiers"
      href={buildExportEstablishmentRoute({
        aggregateProfession: false,
        groupKey: "region",
        sourceProvider: "cci",
      })}
    />
    <Link
      title="Les entreprises référencées par la unJeuneUneSolution (region) avec aggrégation
      des métiers"
      href={buildExportEstablishmentRoute({
        aggregateProfession: true,
        groupKey: "region",
        sourceProvider: "unJeuneUneSolution",
      })}
    />
  </div>
);

const ConventionTab = ({ route }: AdminProps) => {
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
    <div>
      <div className="fr-h5">Conventions à traiter</div>
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

const Link = ({ title, href }: { title: string; href: string }) => (
  <a
    className="fr-link fr-fi-arrow-right-line fr-link--icon-left"
    href={href}
    target="_blank"
  >
    {title}
  </a>
);
