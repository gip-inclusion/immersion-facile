import React, { useState } from "react";
import { ArrayDropdown, DsfrTitle } from "react-design-system/immersionFacile";
import {
  DepartmentOrRegion,
  EstablishmentExportConfigDto,
  FormSourceProvider,
} from "shared/src/establishmentExport/establishmentExport.dto";
import {
  exportConventionsExcelRoute,
  exportEstablismentsExcelRoute,
} from "shared/src/routes";
import { queryParamsAsString } from "shared/src/utils/queryParams";
import { WithBackground } from "src/uiComponents/admin/WithBackground";
import "./Admin.css";

const buildExportEstablishmentRoute = (params: EstablishmentExportConfigDto) =>
  `/api/${exportEstablismentsExcelRoute}?${queryParamsAsString<EstablishmentExportConfigDto>(
    params,
  )}`;

export const DataExportTab = () => {
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
const Link = ({ text, href }: { text: string; href: string }) => (
  <a
    className="fr-link fr-fi-arrow-right-line fr-link--icon-left"
    href={href}
    target="_blank"
  >
    {text}
  </a>
);
