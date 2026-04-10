import { fr } from "@codegouvfr/react-dsfr";
import type { UserEstablishmentRightDetailsWithAcceptedStatus } from "shared";

export const EstablishmentLineAdminsInfos = ({
  data,
}: {
  data: UserEstablishmentRightDetailsWithAcceptedStatus;
}) => (
  <ul className={fr.cx("fr-raw-list")}>
    {data.admins.map((admin) => (
      <li key={`${admin.email}-${admin.firstName}-${admin.lastName}`}>
        <a
          href={`mailto:${admin.email}`}
          target="_blank"
          rel="noreferrer"
          className={fr.cx("fr-tag", "fr-tag--sm")}
        >
          {admin.firstName && admin.lastName ? (
            <>
              {admin.firstName} {admin.lastName}
            </>
          ) : (
            admin.email
          )}
        </a>
      </li>
    ))}
  </ul>
);
