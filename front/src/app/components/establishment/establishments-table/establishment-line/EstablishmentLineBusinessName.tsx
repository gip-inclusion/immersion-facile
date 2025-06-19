import { fr } from "@codegouvfr/react-dsfr";
import { Tag } from "react-design-system";
import type { WithEstablishmentData } from "shared";

export const EstablishmentLineBusinessName = ({
  withEstablishmentData,
}: {
  withEstablishmentData: WithEstablishmentData;
}) => (
  <ul key={withEstablishmentData.siret} className={fr.cx("fr-raw-list")}>
    <li>
      <Tag theme={"etablissement"} />
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
