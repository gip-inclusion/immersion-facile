import { fr } from "@codegouvfr/react-dsfr";
import { Table } from "@codegouvfr/react-dsfr/Table";
import React from "react";
import {
  AgencyRight,
  InclusionConnectedUser,
  addressDtoToString,
  agencyKindToLabelIncludingIF,
} from "shared";
import { AgencyStatusBadge } from "src/app/components/agency/AgencyStatusBadge";
import { AgencyTag } from "src/app/components/agency/AgencyTag";
import { agencyRoleToDisplay } from "src/app/components/agency/AgencyUsers";
import { routes } from "src/app/routes/routes";

type UserDetailProps = {
  title: string;
  userWithRights: InclusionConnectedUser;
};

export const UserDetail = ({ title, userWithRights }: UserDetailProps) => {
  return (
    <div>
      <h1>{title}</h1>

      <p className={fr.cx("fr-text--bold")}>Informations personnelles</p>

      <ul className={fr.cx("fr-text--sm")}>
        <li>Id de l'utilisateur: {userWithRights.id}</li>
        <li>Email : {userWithRights.email}</li>
        {userWithRights.firstName && (
          <li>Prénom : {userWithRights.firstName}</li>
        )}
        {userWithRights.lastName && <li>Nom : {userWithRights.lastName}</li>}
      </ul>

      <AgenciesTable
        agencyRights={[...userWithRights.agencyRights].sort((a, b) =>
          a.agency.name.localeCompare(b.agency.name),
        )}
      />
    </div>
  );
};

const AgenciesTable = ({ agencyRights }: { agencyRights: AgencyRight[] }) => {
  if (!agencyRights.length)
    return <p>Cet utilisateur n'est lié à aucune agence</p>;

  return (
    <>
      <p className={fr.cx("fr-text--bold")}>
        Organismes rattachés au profil ({agencyRights.length} agences)
      </p>

      <Table
        headers={[
          "Nom d'agence",
          "Type d'agence",
          "Roles",
          "Reçoit les notifications",
          "Actions",
        ]}
        data={agencyRights.map((agencyRight) => {
          return [
            <>
              <AgencyTag
                refersToAgencyName={agencyRight.agency.refersToAgencyName}
              />
              <AgencyStatusBadge status={agencyRight.agency.status} />
              <br />
              <span>{agencyRight.agency.name}</span>
              <br />
              <span className={fr.cx("fr-hint-text")}>
                {addressDtoToString(agencyRight.agency.address)}
              </span>
            </>,
            agencyKindToLabelIncludingIF[agencyRight.agency.kind],
            agencyRight.roles
              .map((role) => agencyRoleToDisplay[role].label)
              .join(", "),
            agencyRight.isNotifiedByEmail ? "Oui" : "Non",
            <a
              {...routes.adminAgencyDetail({ agencyId: agencyRight.agency.id })}
            >
              Voir l'agence
            </a>,
          ];
        })}
      />
    </>
  );
};
