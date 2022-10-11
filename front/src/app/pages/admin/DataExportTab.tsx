import DownloadIcon from "@mui/icons-material/Download";
import { Checkbox, CircularProgress } from "@mui/material";
import React, { useState } from "react";
import {
  ArrayDropdown,
  DsfrTitle,
  ImmersionTextField,
} from "react-design-system/immersionFacile";
import {
  AgenciesExportableParams,
  ContactRequestsExportableParams,
  ConventionsExportableParams,
  createManagedAxiosInstance,
  EstablishmentsWithAggregatedOffersExportableParams,
  EstablishmentsWithFlattenOffersExportableParams,
} from "shared";
import { HttpExcelExportGateway } from "src/core-logic/adapters/ExcelExportGateway/HttpExcelExportGateway";
import { useAdminToken } from "src/hooks/useAdminToken";
import { WithBackground } from "src/uiComponents/admin/WithBackground";
import "./admin.css";

// TODO Mettre dans les dépendances ?
export const excelExportGateway = new HttpExcelExportGateway(
  createManagedAxiosInstance({ baseURL: "/api" }),
);

export const DataExportTab = () => (
  <div className="flex flex-col gap-8">
    <ExportEntreprises />
    <ExportConventions />
    <ExportAgencies />
    <ExportContactRequests />
  </div>
);

const ExportEntreprises = () => {
  const adminToken = useAdminToken();

  const [exportableParams, setExportableParams] = useState<
    | EstablishmentsWithFlattenOffersExportableParams
    | EstablishmentsWithAggregatedOffersExportableParams
  >({
    name: "establishments_with_flatten_offers",
    filters: {},
    keyToGroupBy: undefined,
  });

  return (
    <div>
      <DsfrTitle level={5} text="Les entreprises référencées" />
      <WithBackground>
        <div className="w-2/3">
          <ArrayDropdown
            label="Périmètre"
            options={["Région", "Département"]}
            allowEmpty={true}
            onSelect={(selectedGroupKey) => {
              if (selectedGroupKey) {
                setExportableParams({
                  ...exportableParams,
                  keyToGroupBy: selectedGroupKey,
                });
              }
            }}
            defaultSelectedOption={undefined}
          />
          <ArrayDropdown
            label="Filtre par origine"
            options={[
              "immersion-facile",
              "cci",
              "cma",
              "lesentreprises-sengagent",
              "unJeuneUneSolution",
            ]}
            onSelect={(selectedSourceProvider) => {
              setExportableParams({
                ...exportableParams,
                filters: {
                  ...exportableParams.filters,
                  Origine: selectedSourceProvider,
                },
              });
            }}
            allowEmpty={true}
            defaultSelectedOption={undefined}
          />
          <ImmersionTextField
            label="Filtre par activité"
            name="Filter par activité"
            placeholder="Ex : Culture"
            className="flex justify-between"
            onChange={(event) => {
              setExportableParams({
                ...exportableParams,
                filters: {
                  ...exportableParams.filters,
                  "Division NAF": event.target.value,
                },
              });
            }}
          />
          <LabeledCheckbox
            label="Aggrégation des métiers (1 ligne par entreprise)"
            onChange={(checked) => {
              if (checked) {
                setExportableParams({
                  ...exportableParams,
                  name: "establishments_with_aggregated_offers",
                });
              } else {
                setExportableParams({
                  ...exportableParams,
                  name: "establishments_with_flatten_offers",
                });
              }
            }}
          />
          <div className="self-center mt-3">
            <DownloadButton
              onClick={() =>
                excelExportGateway.exportData(adminToken, {
                  fileName: "Établissements sans aggregation des métiers",
                  exportableParams,
                })
              }
            />
          </div>
        </div>
      </WithBackground>
    </div>
  );
};

const ExportConventions = () => {
  const adminToken = useAdminToken();

  const [exportableParams, setExportableParams] =
    useState<ConventionsExportableParams>({
      name: "conventions",
      filters: {},
      keyToGroupBy: undefined,
    });

  return (
    <div>
      <DsfrTitle level={5} text="Les conventions" />
      <WithBackground>
        <div className="w-2/3">
          <ArrayDropdown
            label="Périmètre"
            options={["Structure"]}
            allowEmpty={true}
            onSelect={(selectedGroupKey) => {
              if (selectedGroupKey) {
                setExportableParams({
                  ...exportableParams,
                  keyToGroupBy: selectedGroupKey,
                });
              }
            }}
            defaultSelectedOption={undefined}
          />
          <ArrayDropdown
            label="Filtre par statut"
            options={[
              "DRAFT",
              "CANCELLED",
              "REJECTED",
              "ACCEPTED_BY_VALIDATOR",
              "ACCEPTED_BY_COUNSELLOR",
              "PARTIALLY_SIGNED",
              "READY_TO_SIGN",
              "IN_REVIEW",
            ]}
            onSelect={(selectedStatut) => {
              setExportableParams({
                ...exportableParams,
                filters: {
                  ...exportableParams.filters,
                  Statut: selectedStatut,
                },
              });
            }}
            allowEmpty={true}
            defaultSelectedOption={undefined}
          />
          <ArrayDropdown
            label="Type de structure"
            options={[
              "kind",
              "structure-IAE",
              "cap-emploi",
              "mission-locale",
              "pole-emploi",
              "autre",
              "prepa-apprentissage",
              "conseil-departemental",
            ]}
            onSelect={(selectedStatut) => {
              setExportableParams({
                ...exportableParams,
                filters: {
                  ...exportableParams.filters,
                  "Type de structure": selectedStatut,
                },
              });
            }}
            allowEmpty={true}
            defaultSelectedOption={undefined}
          />
          <ImmersionTextField
            label="Filtre par département"
            name="Filter par département"
            placeholder="Ex : Mayotte"
            className="flex justify-between"
            onChange={(event) => {
              setExportableParams({
                ...exportableParams,
                filters: {
                  ...exportableParams.filters,
                  "Département de la structure": event.target.value,
                },
              });
            }}
          />
          <ImmersionTextField
            label="Filtre par Région"
            name="Filter par Région"
            placeholder="Ex : La Réunion"
            className="flex justify-between"
            onChange={(event) => {
              setExportableParams({
                ...exportableParams,
                filters: {
                  ...exportableParams.filters,
                  "Région de la structure": event.target.value,
                },
              });
            }}
          />
          <div className="self-center mt-3">
            <DownloadButton
              onClick={() =>
                excelExportGateway.exportData(adminToken, {
                  fileName: "Conventions",
                  exportableParams,
                })
              }
            />
          </div>
        </div>
      </WithBackground>
    </div>
  );
};

const ExportAgencies = () => {
  const adminToken = useAdminToken();

  const [exportableParams, setExportableParams] =
    useState<AgenciesExportableParams>({
      name: "agencies",
      filters: {},
      keyToGroupBy: undefined,
    });

  return (
    <div>
      <DsfrTitle level={5} text="Les agences" />
      <WithBackground>
        <div className="w-2/3">
          <ArrayDropdown
            label="Périmètre"
            options={["Région", "Département", "Type"]}
            allowEmpty={true}
            onSelect={(selectedGroupKey) => {
              if (selectedGroupKey) {
                setExportableParams({
                  ...exportableParams,
                  keyToGroupBy: selectedGroupKey,
                });
              }
            }}
            defaultSelectedOption={undefined}
          />
          <ArrayDropdown
            label="Filtre par statut"
            options={["from-api-PE", "active", "closed", "needsReview"]}
            onSelect={(selectedStatut) => {
              setExportableParams({
                ...exportableParams,
                filters: {
                  ...exportableParams.filters,
                  Statut: selectedStatut,
                },
              });
            }}
            allowEmpty={true}
            defaultSelectedOption={undefined}
          />
          <div className="self-center mt-3">
            <DownloadButton
              onClick={() =>
                excelExportGateway.exportData(adminToken, {
                  fileName: "Agences",
                  exportableParams,
                })
              }
            />
          </div>
        </div>
      </WithBackground>
    </div>
  );
};

const ExportContactRequests = () => {
  const adminToken = useAdminToken();

  const [exportableParams, setExportableParams] =
    useState<ContactRequestsExportableParams>({
      name: "contact_requests",
      filters: {},
      keyToGroupBy: undefined,
    });

  return (
    <div>
      <DsfrTitle level={5} text="Mises en relation" />
      <WithBackground>
        <div className="w-2/3">
          <ArrayDropdown
            label="Périmètre"
            options={["Région", "Département"]}
            allowEmpty={true}
            onSelect={(selectedGroupKey) => {
              if (selectedGroupKey) {
                setExportableParams({
                  ...exportableParams,
                  keyToGroupBy: selectedGroupKey,
                });
              }
            }}
            defaultSelectedOption={undefined}
          />

          <div className="self-center mt-3">
            <DownloadButton
              onClick={() =>
                excelExportGateway.exportData(adminToken, {
                  fileName: "Mises en relation",
                  exportableParams,
                })
              }
            />
          </div>
        </div>
      </WithBackground>
    </div>
  );
};

const DownloadButton = ({ onClick }: { onClick: () => Promise<void> }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  return (
    <>
      <button
        disabled={isDownloading}
        className="fr-btn"
        onClick={(_e) => {
          setError(undefined);
          setIsDownloading(true);
          return onClick()
            .then(() => setIsDownloading(false))
            .catch((_) => {
              setIsDownloading(false);
              setError("Rien à exporter...");
            });
        }}
      >
        {" "}
        {!isDownloading && <DownloadIcon />}
        {isDownloading && <CircularProgress size={20} />}
        Télécharger
      </button>
      {error && <div className="text-red-500 italic mt-2">{error}</div>}
    </>
  );
};

const LabeledCheckbox = ({
  label,
  onChange,
}: {
  label: string;
  onChange: (checked: boolean) => void;
}) => (
  <div className="flex gap-4 items-center font-medium justify-between">
    <label className="fr-label">{label}</label>
    <Checkbox
      onChange={(e) => onChange(e.currentTarget.checked)}
      color="primary"
    />
  </div>
);
