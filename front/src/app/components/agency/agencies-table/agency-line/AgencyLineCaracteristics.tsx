import { fr } from "@codegouvfr/react-dsfr";
import type { ReactNode } from "react";
import {
  type AgencyRight,
  activeAgencyStatuses,
  agencyKindToLabelIncludingIFAndPrepa,
} from "shared";
import { AgencyStatusBadge } from "../../AgencyStatusBadge";
import { AgencyTag } from "../../AgencyTag";

export const AgencyLineCaracteristics = ({
  agencyRight,
}: { agencyRight: AgencyRight }): ReactNode => (
  <ul className={fr.cx("fr-raw-list")}>
    <li>
      <AgencyTag refersToAgencyName={agencyRight.agency.refersToAgencyName} />
    </li>
    {!activeAgencyStatuses.includes(agencyRight.agency.status) && (
      <li>
        <AgencyStatusBadge status={agencyRight.agency.status} />
      </li>
    )}
    <li>
      Type : {agencyKindToLabelIncludingIFAndPrepa[agencyRight.agency.kind]}
    </li>
  </ul>
);
