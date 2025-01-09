import { fr } from "@codegouvfr/react-dsfr";
import { ReactNode } from "react";
import { AgencyRight, addressDtoToString } from "shared";
import { routes } from "src/app/routes/routes";

export const AgencyLineAgencyName = ({
  agencyRight,
}: { agencyRight: AgencyRight }): ReactNode => (
  <div key={agencyRight.agency.id}>
    {agencyRight.agency.name}
    <span className={fr.cx("fr-hint-text")}>
      {addressDtoToString(agencyRight.agency.address)}
    </span>

    {agencyRight.roles.includes("agency-admin") && (
      <a
        className={fr.cx(
          "fr-link",
          "fr-text--sm",
          "fr-icon-arrow-right-line",
          "fr-link--icon-right",
        )}
        {...routes.agencyDashboardAgencyDetails({
          agencyId: agencyRight.agency.id,
        }).link}
      >
        Voir l'agence
      </a>
    )}
  </div>
);
