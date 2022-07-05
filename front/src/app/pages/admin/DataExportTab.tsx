import React, { useState } from "react";
import { ArrayDropdown, DsfrTitle } from "react-design-system/immersionFacile";
import {
  DepartmentOrRegion,
  FormSourceProvider,
} from "shared/src/establishmentExport/establishmentExport.dto";
import { HttpExcelExportGateway } from "src/core-logic/adapters/HttpExcelExportGateway";
import { useAdminToken } from "src/hooks/useAdminToken";
import { WithBackground } from "src/uiComponents/admin/WithBackground";
import "./Admin.css";

export const excelExportGateway = new HttpExcelExportGateway();

export const DataExportTab = () => {
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
    <div className="flex flex-col gap-1">
      <div>
        <DsfrTitle level={5} text="Les conventions" />
        <Link
          text="Les conventions par agences"
          onClick={() => excelExportGateway.exportConventions(adminToken)}
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
    </div>
  );
};

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
