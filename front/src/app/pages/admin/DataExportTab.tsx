import { Checkbox } from "@mui/material";
import React, { useState } from "react";
import {
  ArrayDropdown,
  DsfrTitle,
  ImmersionTextField,
} from "react-design-system/immersionFacile";
import {
  DepartmentOrRegion,
  FormSourceProvider,
} from "shared/src/establishmentExport/establishmentExport.dto";
import { HttpExcelExportGateway } from "src/core-logic/adapters/ExcelExportGateway/HttpExcelExportGateway";
import {
  EstablishmentsWithAggregatedOffersExportableParams,
  EstablishmentsWithFlattenOffersExportableParams,
} from "src/../../shared/src/exportable";
import { HttpExcelExportGateway } from "src/core-logic/adapters/HttpExcelExportGateway";
import { useAdminToken } from "src/hooks/useAdminToken";
import { WithBackground } from "src/uiComponents/admin/WithBackground";
import "./Admin.css";
import { createManagedAxiosInstance } from "shared/src/httpClient/ports/axios.port";
import DownloadIcon from "@mui/icons-material/Download";

// TODO Mettre dans les dépendances ?
export const excelExportGateway = new HttpExcelExportGateway(
  createManagedAxiosInstance({ baseURL: "/api" }),
);

export const DataExportTab = () => {
  const adminToken = useAdminToken();

  return (
    <div className="flex flex-col gap-1">
      <div>
        <DsfrTitle level={5} text="Les conventions" />
        <Link
          text="Les conventions par agences"
          onClick={() => excelExportGateway.exportConventions(adminToken)}
        />
      </div>
      <ExportEntreprisesV1 />
      <ExportEntreprisesV2 />
    </div>
  );
};

const ExportEntreprisesV1 = () => {
  const adminToken = useAdminToken();

  const [
    conventionExportSelectedGroupKey,
    setConventionExportSelectedGroupKey,
  ] = useState<DepartmentOrRegion>("region");

  const [
    conventionExportSelectedSourceProvider,
    setConventionExportSelectedSourceProvider,
  ] = useState<FormSourceProvider>("all");

  return (
    <div>
      <DsfrTitle level={5} text="Les entreprises référencées (v1)" />
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
        onClick={() =>
          excelExportGateway.exportEstablishments(adminToken, {
            aggregateProfession: false,
            groupKey: conventionExportSelectedGroupKey,
            sourceProvider: conventionExportSelectedSourceProvider,
          })
        }
      />

      <Link
        text={`${
          conventionExportSelectedSourceProvider === "all"
            ? "Toutes les entreprises référencées"
            : "Les entreprises de source " +
              conventionExportSelectedSourceProvider
        } par ${conventionExportSelectedGroupKey} avec aggrégation
des métiers`}
        onClick={() =>
          excelExportGateway.exportEstablishments(adminToken, {
            aggregateProfession: true,
            groupKey: conventionExportSelectedGroupKey,
            sourceProvider: conventionExportSelectedSourceProvider,
          })
        }
      />
    </div>
  );
};

const ExportEntreprisesV2 = () => {
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
      <DsfrTitle level={5} text="Les entreprises référencées (v2)" />
      <WithBackground>
        <div className="w-2/3">
          <ArrayDropdown
            label="Groupement"
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
              "testConsumer",
            ]}
            onSelect={(selectedSourceProvider) => {
              if (selectedSourceProvider) {
                setExportableParams({
                  ...exportableParams,
                  filters: {
                    ...exportableParams.filters,
                    Origine: selectedSourceProvider,
                  },
                });
              }
            }}
            allowEmpty={true}
            defaultSelectedOption={undefined}
          />
          <ImmersionTextField
            label="Filtre par division"
            name="Filter par division"
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

const DownloadButton = ({ onClick }: { onClick: () => void }) => (
  <button
    className="fr-btn"
    onClick={(_e) => {
      onClick();
    }}
  >
    {" "}
    <DownloadIcon />
    Télécharger
  </button>
);

// implementation could be improved, using a button and giving it a link style for exemple
const Link = ({
  text,
  onClick,
}: {
  text: string;
  onClick: React.MouseEventHandler<HTMLAnchorElement>;
}) => (
  <a
    className="fr-link fr-fi-arrow-right-line fr-link--icon-left"
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    href="#"
    target="_blank"
  >
    {text}
  </a>
);

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
