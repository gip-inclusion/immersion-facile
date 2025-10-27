import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { Tag } from "react-design-system";
import { domElementIds, type EstablishmentData } from "shared";
import { routes } from "src/app/routes/routes";

export const EstablishmentLineBusinessName = ({
  data,
  isBackofficeAdmin,
}: {
  data: EstablishmentData;
  isBackofficeAdmin?: boolean;
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
    {isBackofficeAdmin && (
      <Button
        priority="tertiary no outline"
        id={`${domElementIds.profile.adminEstablishmentLink}-${data.siret}`}
        size="small"
        linkProps={
          routes.manageEstablishmentAdmin({
            siret: data.siret,
          }).link
        }
      >
        Voir comme admin IF
      </Button>
    )}
  </ul>
);
