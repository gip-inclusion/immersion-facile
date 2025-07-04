import { fr } from "@codegouvfr/react-dsfr";
import { Tag } from "react-design-system";
import type { EstablishmentData } from "shared";

export const EstablishmentLineBusinessName = ({
  data,
}: {
  data: EstablishmentData;
}) => (
  <ul key={data.siret} className={fr.cx("fr-raw-list")}>
    <li>
      <Tag theme={"etablissement"} />
    </li>
    <li> {data.businessName}</li>
    <li>
      {" "}
      <span className={fr.cx("fr-hint-text")}>{data.siret}</span>
    </li>
  </ul>
);
