import Button from "@codegouvfr/react-dsfr/Button";
import Table from "@codegouvfr/react-dsfr/Table";
import { Fragment } from "react";
import { type BeneficiaryConventionListDto, domElementIds } from "shared";
import { ConventionAssessmentStatusBadge } from "../../convention/ConventionAssessmentStatusBadge";
import { ConventionDatesDisplay } from "../../convention/ConventionDatesDisplay";
import { ConventionStatusBadge } from "../../convention/ConventionStatusBadge";

export const BeneficiaryConventionList = (): React.ReactNode => {
  return (
    <>
      <h1>Conventions</h1>

      <Table
        id={
          domElementIds.beneficiaryDashboardConventions
            .beneficiaryConventionListTable
        }
        fixed
        headers={["Entreprise", "Statut", "Bilan", "Dates", "Actions"]}
        data={conventionListToTableData(conventionList)}
      />
    </>
  );
};

const conventionListToTableData = (
  conventionList: BeneficiaryConventionListDto,
): React.ReactNode[][] =>
  conventionList.map<React.ReactNode[]>((convention) => [
    convention.businessName,
    <Fragment key={convention.conventionId}>
      <ConventionStatusBadge
        conventionStatus={convention.status}
        userKind="beneficiary"
      />
    </Fragment>,
    <Fragment key={convention.conventionId}>
      <ConventionAssessmentStatusBadge
        conventionParams={convention}
        userKind="beneficiary"
      />
    </Fragment>,
    <Fragment key={convention.conventionId}>
      <ConventionDatesDisplay convention={convention} />
    </Fragment>,
    <Button disabled key={convention.conventionId}>
      Voir la convention
    </Button>,
  ]);

const conventionList: BeneficiaryConventionListDto = [
  {
    conventionId: "507c5e95-b97b-41cb-8c01-578e4f97f930",
    status: "ACCEPTED_BY_VALIDATOR",
    assessment: null,
    businessName: "KIKI CORP",
    dateStart: new Date("2025-01-02").toISOString(),
    dateEnd: new Date("2025-01-16").toISOString(),
  },
  {
    conventionId: "507c5e95-b97b-41cb-8c01-578e4f97f930",
    status: "ACCEPTED_BY_VALIDATOR",
    assessment: {
      status: "COMPLETED",
      createdAt: new Date("2026-06-08").toISOString(),
      endedWithAJob: false,
      signedAt: null,
    },
    businessName: "GROS MICHEL SARL",
    dateStart: new Date("2026-05-06").toISOString(),
    dateEnd: new Date("2026-05-30").toISOString(),
  },
  {
    conventionId: "507c5e95-b97b-41cb-8c01-578e4f97f930",
    status: "ACCEPTED_BY_VALIDATOR",
    assessment: {
      status: "COMPLETED",
      createdAt: new Date("2026-06-08").toISOString(),
      endedWithAJob: false,
      signedAt: new Date("2026-06-09").toISOString(),
    },
    businessName: "GROS MICHEL SARL",
    dateStart: new Date("2026-05-06").toISOString(),
    dateEnd: new Date("2026-05-30").toISOString(),
  },
];
