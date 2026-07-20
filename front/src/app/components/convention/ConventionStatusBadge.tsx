import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import type { ConventionStatus } from "shared";
import { labelAndSeverityByStatus } from "src/app/contents/convention/labelAndSeverityByStatus";

export const ConventionStatusBadge = ({
  conventionStatus,
  userKind,
}: {
  conventionStatus: ConventionStatus;
  userKind: "agency" | "beneficiary";
}): React.ReactNode => {
  const { color, agencyLabel, beneficiaryLabel } =
    labelAndSeverityByStatus[conventionStatus];

  return (
    <Badge className={fr.cx(color)} small>
      {userKind === "agency" ? agencyLabel : beneficiaryLabel}
    </Badge>
  );
};
