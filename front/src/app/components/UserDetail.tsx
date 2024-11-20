import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Table } from "@codegouvfr/react-dsfr/Table";
import React from "react";
import {
  AgencyRight,
  InclusionConnectedUser,
  activeAgencyStatuses,
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
  editInformationsLink?: string;
};

export const UserDetail = ({
  title,
  userWithRights,
  editInformationsLink,
}: UserDetailProps) => {
  return (
    <div>
      <h1>{title}</h1>

      <h2 className={fr.cx("fr-h4")}>Informations personnelles</h2>

      <ul className={fr.cx("fr-text--sm", "fr-mb-2w")}>
        <li>Id de l'utilisateur: {userWithRights.id}</li>
        <li>Email : {userWithRights.email}</li>
        {userWithRights.firstName && (
          <li>Prénom : {userWithRights.firstName}</li>
        )}
        {userWithRights.lastName && <li>Nom : {userWithRights.lastName}</li>}
      </ul>

      {editInformationsLink && (
        <Button
          className={fr.cx("fr-mb-4w")}
          priority="secondary"
          linkProps={{
            href: editInformationsLink,
            target: "_blank",
          }}
        >
          Modifier mes informations
        </Button>
      )}

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
      <h2 className={fr.cx("fr-h4")}>
        Organismes rattachés au profil ({agencyRights.length} agences)
      </h2>

      <Table
        headers={[
          "Nom d'agence",
          "Carractéristiques de l'agence",
          "Roles",
          "Reçoit les notifications",
          "Actions",
        ]}
        data={agencyRights.map((agencyRight) => {
          const viewAgencyProps = !agencyRight.roles.includes("agency-admin")
            ? {
                disabled: true,
                title:
                  "Vous n'êtes pas administrateur de cette agence. Seuls les administrateurs de l'agence peuvent voir le détail.",
              }
            : {
                linkProps: routes.adminAgencyDetail({
                  agencyId: agencyRight.agency.id,
                }).link,
              };

          return [
            <>
              {agencyRight.agency.name}
              <span className={fr.cx("fr-hint-text")}>
                {addressDtoToString(agencyRight.agency.address)}
              </span>
            </>,
            <ul className={fr.cx("fr-raw-list")}>
              <li>
                <AgencyTag
                  refersToAgencyName={agencyRight.agency.refersToAgencyName}
                />
              </li>
              {!activeAgencyStatuses.includes(agencyRight.agency.status) && (
                <li>
                  <AgencyStatusBadge status={agencyRight.agency.status} />
                </li>
              )}
              <li>
                Type : {agencyKindToLabelIncludingIF[agencyRight.agency.kind]}
              </li>
            </ul>,
            agencyRight.roles
              .map((role) => agencyRoleToDisplay[role].label)
              .join(", "),
            agencyRight.isNotifiedByEmail ? "Oui" : "Non",
            <Button
              priority="tertiary no outline"
              size="small"
              {...viewAgencyProps}
            >
              Voir l'agence
            </Button>,
          ];
        })}
      />
    </>
  );
};
