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
        isAdmin={userWithRights.isBackofficeAdmin}
      />
    </div>
  );
};

const AgenciesTable = ({
  agencyRights,
  isAdmin,
}: {
  agencyRights: AgencyRight[];
  isAdmin?: boolean;
}) => {
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
          ...(isAdmin ? ["Actions"] : []),
        ]}
        data={agencyRights.map((agencyRight) => [
          <>
            {agencyRight.agency.name}
            <span className={fr.cx("fr-hint-text")}>
              {addressDtoToString(agencyRight.agency.address)}
            </span>

            {agencyRight.roles.includes("agency-admin") && isAdmin && (
              <a
                className={fr.cx(
                  "fr-link",
                  "fr-text--sm",
                  "fr-icon-arrow-right-line",
                  "fr-link--icon-right",
                )}
                {...routes.adminAgencyDetail({
                  // this should be changed to agencyDashboardAgency/:agencyId, when it is ready
                  agencyId: agencyRight.agency.id,
                }).link}
              >
                Voir l'agence
              </a>
            )}
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
          ...(isAdmin
            ? [
                <Button
                  priority="tertiary no outline"
                  size="small"
                  linkProps={
                    routes.adminAgencyDetail({
                      agencyId: agencyRight.agency.id,
                    }).link
                  }
                >
                  Voir l'agence comme admin IF
                </Button>,
              ]
            : []),
        ])}
      />
    </>
  );
};
