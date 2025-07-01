import { fr } from "@codegouvfr/react-dsfr";
import type { WithEstablishmentData } from "shared";

export const EstablishmentLineAdminsInfos = ({
  withEstablishmentData,
}: {
  withEstablishmentData: WithEstablishmentData;
}) => (
  <ul className={fr.cx("fr-raw-list")}>
    {withEstablishmentData.admins.map((admin) => (
      <li key={`${admin.email}-${admin.firstName}-${admin.lastName}`}>
        <a
          href={`mailto:${admin.email}`}
          target="_blank"
          rel="noreferrer"
          className={fr.cx("fr-tag", "fr-tag--sm")}
        >
          {admin.firstName} {admin.lastName}
        </a>
      </li>
    ))}
  </ul>
);
