import { AlertProps } from "@codegouvfr/react-dsfr/Alert";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { AgencyStatus, agencyStatusToLabel } from "shared";

const agencyStatusToSeverity: Record<AgencyStatus, AlertProps.Severity> = {
  "from-api-PE": "success",
  active: "success",
  closed: "error",
  rejected: "error",
  needsReview: "warning",
};

export const AgencyStatusBadge = ({ status }: { status: AgencyStatus }) => {
  return (
    <Badge noIcon severity={agencyStatusToSeverity[status]}>
      {agencyStatusToLabel[status]}
    </Badge>
  );
};
