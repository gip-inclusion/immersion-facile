import { Table } from "@codegouvfr/react-dsfr/Table";
import { useEffect } from "react";
import { Loader } from "react-design-system";
import { useDispatch } from "react-redux";
import { AgencyRight, agencyKindToLabel } from "shared";
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

  return (
    <div>
      <h1>Utilisateur</h1>

      <ul>
        <li>Id : {icUser.id}</li>
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
      <h2>Agences liées ({agencyRights.length} agences)</h2>

      <Table
        fixed
        headers={[
          "Nom d'agence",
          "Type d'agence",
          "Roles",
          "Reçoit les notifications",
        ]}
        data={agencyRights.map((agencyRight) => [
          agencyRight.agency.name,
          agencyKindToLabel[agencyRight.agency.kind],
          agencyRight.roles.join(", "),
          agencyRight.isNotifiedByEmail ? "Oui" : "Non",
        ])}
      />
    </>
  );
};
