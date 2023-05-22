import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { keys } from "ramda";
import { ConventionReadDto, DotNestedKeys } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";

type ConventionSummaryRows = [
  keyof ConventionReadDto | DotNestedKeys<ConventionReadDto>,
  string | undefined,
][];

const mapConventionToTableDataDebug = (convention: ConventionReadDto) =>
  keys(convention).map((key) => [key, JSON.stringify(convention[key])]);

const mapConventionToTableData = (
  convention: ConventionReadDto,
): ConventionSummaryRows => {
  const rawData: ConventionSummaryRows = [
    ["signatories.beneficiary.email", convention.signatories.beneficiary.email],
    ["signatories.beneficiary.phone", convention.signatories.beneficiary.phone],
    [
      "signatories.establishmentRepresentative.email",
      convention.signatories.establishmentRepresentative.email,
    ],
    [
      "signatories.establishmentRepresentative.phone",
      convention.signatories.establishmentRepresentative.phone,
    ],
    [
      "signatories.beneficiaryRepresentative.email",
      convention.signatories.beneficiaryRepresentative?.email,
    ],
  ];
  return rawData.filter((row) => row[1] !== undefined);
};

export const ConventionSummary = ({
  validationAction,
}: {
  validationAction?: React.ReactNode;
}) => {
  const convention = useAppSelector(conventionSelectors.convention);
  if (!convention) return null;
  return (
    <div className={fr.cx("fr-col")}>
      <section>
        <Table
          caption="Récapitulatif de la convention"
          data={mapConventionToTableData(convention)}
          noCaption
        />
        <Table
          caption="Récapitulatif de la convention"
          data={mapConventionToTableDataDebug(convention)}
          noCaption
        />
      </section>
      {validationAction}
    </div>
  );
};
