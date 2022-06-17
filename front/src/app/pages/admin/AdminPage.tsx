import React, { useEffect, useState } from "react";
import { AgencyDto, AgencyId } from "shared/src/agency/agency.dto";
import {
  DepartmentOrRegion,
  EstablishmentExportConfigDto,
  FormSourceProvider,
} from "shared/src/establishmentExport/establishmentExport.dto";
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
import { agencyGateway, conventionGateway } from "src/app/config/dependencies";
import { routes } from "src/app/routing/routes";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { ConventionFormAccordion } from "src/uiComponents/admin/ConventionFormAccordion";
import { FormMagicLinks } from "src/uiComponents/admin/FormMagicLinks";
import { prop } from "ramda";
import { Route } from "type-route";
import "./Admin.css";
import { ArrayDropdown, DsfrTitle } from "react-design-system/immersionFacile";
import { Tabs, Tab } from "@dataesr/react-dsfr";
import { WithBackground } from "src/uiComponents/admin/WithBackground";
import { AgencyDetails } from "src/uiComponents/admin/AgencyDetails";
import { Notification } from "react-design-system/immersionFacile";
import { propEq } from "src/../../shared/src/ramdaExtensions/propEq";
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
        <div className="fr-col-lg-8 fr-p-2w mt-4" style={{ width: "95%" }}>
          <Tabs className="min-h-screen" defaultActiveTab={0}>
            <Tab
              className={featureFlags.enableAdminUi ? "" : "hidden"}
              label="Conventions"
              index={0}
            >
              <ConventionTab route={route} />
            </Tab>
            <Tab
              className={featureFlags.enableAdminUi ? "" : "hidden"}
              label="Agences"
              index={1}
            >
              <AgencyTab />
            </Tab>
            <Tab label="Export de données" index={2}>
              <DataExportTab />
            </Tab>
          </Tabs>
        </div>
      </div>
    </>
  );
};

const DataExportTab = () => {
  const [
    conventionExportSelectedGroupKey,
    setConventionExportSelectedGroupKey,
  ] = useState<DepartmentOrRegion>("region");

  const [
    conventionExportSelectedSourceProvider,
    setConventionExportSelectedSourceProvider,
  ] = useState<FormSourceProvider>("all");

  return (
    <div className="flex flex-col gap-1">
      <div>
        <DsfrTitle level={5} text="Les conventions" />
        <Link
          text="Les conventions par agences"
          href={`/api/${exportConventionsExcelRoute}`}
        />
      </div>
      <div>
        <DsfrTitle level={5} text="Les entreprises référencées" />
        <WithBackground>
          <div className="w-2/3">
            <ArrayDropdown
              label="Sélectionner un groupement"
              options={["region", "department"]}
              onSelect={(selectedGroupKey) => {
                if (selectedGroupKey) {
                  setConventionExportSelectedGroupKey(selectedGroupKey);
                }
              }}
              allowEmpty={false}
              defaultSelectedOption={conventionExportSelectedGroupKey}
            />
            <ArrayDropdown
              label="Sélectionner une source"
              options={[
                "all",
                "immersion-facile",
                "cci",
                "cma",
                "lesentreprises-sengagent",
                "unJeuneUneSolution",
                "testConsumer",
              ]}
              onSelect={(selectedSourceProvider) => {
                if (selectedSourceProvider) {
                  setConventionExportSelectedSourceProvider(
                    selectedSourceProvider,
                  );
                }
              }}
              allowEmpty={false}
              defaultSelectedOption={conventionExportSelectedSourceProvider}
            />
          </div>
        </WithBackground>

        <Link
          text={`${
            conventionExportSelectedSourceProvider === "all"
              ? "Toutes les entreprises référencées"
              : "Les entreprises de source " +
                conventionExportSelectedSourceProvider
          } par ${conventionExportSelectedGroupKey} sans aggrégation
      des métiers`}
          href={buildExportEstablishmentRoute({
            aggregateProfession: false,
            groupKey: conventionExportSelectedGroupKey,
            sourceProvider: conventionExportSelectedSourceProvider,
          })}
        />

        <Link
          text={`${
            conventionExportSelectedSourceProvider === "all"
              ? "Toutes les entreprises référencées"
              : "Les entreprises de source " +
                conventionExportSelectedSourceProvider
          } par ${conventionExportSelectedGroupKey} avec aggrégation
      des métiers`}
          href={buildExportEstablishmentRoute({
            aggregateProfession: true,
            groupKey: conventionExportSelectedGroupKey,
            sourceProvider: conventionExportSelectedSourceProvider,
          })}
        />
      </div>
    </div>
  );
};

const ConventionTab = ({ route }: AdminProps) => {
  const [conventions, setConventions] = useState<ConventionDto[]>([]);

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

const Link = ({ text, href }: { text: string; href: string }) => (
  <a
    className="fr-link fr-fi-arrow-right-line fr-link--icon-left"
    href={href}
    target="_blank"
  >
    {text}
  </a>
);

type ActivationResult = {
  status: "success" | "error";
  text: string;
  message: string;
};

const AgencyTab = () => {
  const [agenciesNeedingReview, setAgenciesNeedingReview] = useState<
    AgencyDto[]
  >([]);

  const [activationButtonDisabled, setActivationButtonDisabled] =
    useState(true);

  const [activationResult, setActivationResult] = useState<
    ActivationResult | undefined
  >();

  const fetchAgenciesNeedingReview = () => {
    agencyGateway.listAgenciesNeedingReview().then(
      (agencies) => {
        setAgenciesNeedingReview(agencies);
      },
      (error: any) => {
        // eslint-disable-next-line no-console
        console.log("setAgenciesNeedingReview", error);
      },
    );
  };

  useEffect(fetchAgenciesNeedingReview, []);

  const [selectedAgency, setSelectedAgency] = useState<AgencyDto | undefined>();

  useEffect(() => setActivationResult(undefined), [selectedAgency?.id]);

  const filterChanged = (selectedAgencyName?: string) => {
    if (!selectedAgencyName) {
      setSelectedAgency(undefined);
      return;
    }
    setSelectedAgency(
      agenciesNeedingReview.find(propEq("name", selectedAgencyName)),
    );
    setActivationButtonDisabled(false);
  };

  const validateAgency = (agency: AgencyDto) => {
    setActivationButtonDisabled(true);
    return agencyGateway
      .validateAgency(agency.id)
      .then(() => {
        setActivationResult({
          status: "success",
          text: "Agence activée",
          message: "L'agence a bien été activée !",
        });
      })
      .catch((error) => {
        setActivationResult({
          status: "error",
          text: "Problème lors de l'activation",
          message: error.message,
        });
      })
      .finally(() => {
        fetchAgenciesNeedingReview();
      });
  };
  return (
    <div>
      <DsfrTitle level={5} text="Activer des agences" />
      <WithBackground>
        <div className="w-2/3">
          <ArrayDropdown
            label="Sélectionner une agence"
            options={agenciesNeedingReview.map(prop("name"))}
            onSelect={filterChanged}
            allowEmpty={true}
            defaultSelectedOption={selectedAgency?.name}
          />
        </div>
      </WithBackground>
      {selectedAgency && (
        <div className="p-4 flex flex-col gap-4">
          <AgencyDetails agency={selectedAgency} />
          <button
            disabled={activationButtonDisabled}
            className="fr-btn flex"
            onClick={() => selectedAgency && validateAgency(selectedAgency)}
          >
            Activer cette agence
          </button>
          {activationResult && (
            <Notification
              type={activationResult.status}
              title={activationResult.text}
            >
              {activationResult.message}
            </Notification>
          )}
        </div>
      )}
    </div>
  );
};
