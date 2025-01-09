import { fr } from "@codegouvfr/react-dsfr";
import { ReactNode } from "react";
import { AgencyRight } from "shared";

export const AgencyLineAdminEmails = ({
  agencyRight,
}: { agencyRight: AgencyRight }): ReactNode => (
  <ul className={fr.cx("fr-raw-list")}>
    {agencyRight.agency.admins.map((admin) => (
      <li>{admin}</li>
    ))}
  </ul>
);
