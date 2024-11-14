import { fr } from "@codegouvfr/react-dsfr";
import { Table } from "@codegouvfr/react-dsfr/Table";
import Tag from "@codegouvfr/react-dsfr/Tag";
import React, { useEffect } from "react";
import { Loader } from "react-design-system";
import { useDispatch } from "react-redux";
import {
  AgencyRight,
  addressDtoToString,
  agencyKindToLabelIncludingIF,
  agencyStatusToLabel,
} from "shared";
import { AgencyTag } from "src/app/components/agency/AgencyTag";
import { agencyRoleToDisplay } from "src/app/components/agency/AgencyUsers";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { adminFetchUserSelectors } from "src/core-logic/domain/admin/fetchUser/fetchUser.selectors";
import { fetchUserSlice } from "src/core-logic/domain/admin/fetchUser/fetchUser.slice";
import { Route } from "type-route";

type AdminUserDetailProps = {
  route: Route<typeof routes.adminUserDetail>;
};

export const AdminUserDetail = ({ route }: AdminUserDetailProps) => {
  const icUser = useAppSelector(adminFetchUserSelectors.fetchedUser);
  const isFetchingUser = useAppSelector(adminFetchUserSelectors.isFetching);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      fetchUserSlice.actions.fetchUserRequested({
        userId: route.params.userId,
      }),
    );
  }, [route.params.userId, dispatch]);

  if (isFetchingUser) return <Loader />;
  if (!icUser) return <p>Aucun utilisateur trouvé</p>;

  const title =
    icUser.firstName && icUser.lastName
      ? `${icUser.firstName} ${icUser.lastName}`
      : icUser.email;

  return (
    <div>
      <h1>{title}</h1>

      <p className={fr.cx("fr-text--bold")}>Informations personnelles</p>

      <ul className={fr.cx("fr-text--sm")}>
        <li>Id de l'utilisateur: {icUser.id}</li>
        <li>Email : {icUser.email}</li>
        {icUser.firstName && <li>Prénom : {icUser.firstName}</li>}
        {icUser.lastName && <li>Nom : {icUser.lastName}</li>}
      </ul>

      <AgenciesTable
        agencyRights={[...icUser.agencyRights].sort((a, b) =>
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
              <Tag>{agencyStatusToLabel[agencyRight.agency.status]}</Tag>
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
