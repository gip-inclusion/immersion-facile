import { fr } from "@codegouvfr/react-dsfr";
import type { ReactNode } from "react";
import type { WithEstablishmentData } from "shared";
import { EstablishmentTag } from "../../EstablishmentTag";

export const EstablishmentLineBusinessName = ({
  withEstablishmentData,
}: { withEstablishmentData: WithEstablishmentData }): ReactNode => (
  <ul key={withEstablishmentData.siret} className={fr.cx("fr-raw-list")}>
    <li>
      <EstablishmentTag />
    </li>
    <li> {withEstablishmentData.businessName}</li>
    <li>
      {" "}
      <span className={fr.cx("fr-hint-text")}>
        {withEstablishmentData.siret}
      </span>
    </li>
  </ul>
);
