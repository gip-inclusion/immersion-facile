import { useEffect } from "react";
import { Loader } from "react-design-system";
import { useDispatch } from "react-redux";
import { AgencyOverview } from "src/app/components/forms/agency/AgencyOverview";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { AgencyDashboard } from "src/app/pages/admin/AgencyTab";
import type { routes } from "src/app/routes/routes";
import { agencyAdminSelectors } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.selectors";
import { agencyAdminSlice } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.slice";
import { connectedUsersAdminSelectors } from "src/core-logic/domain/admin/connectedUsersAdmin/connectedUsersAdmin.selectors";
import { connectedUsersAdminSlice } from "src/core-logic/domain/admin/connectedUsersAdmin/connectedUsersAdmin.slice";
import type { Route } from "type-route";

type AdminAgencyDetailProps = {
  route: Route<typeof routes.adminAgencyDetail>;
};

export const AdminAgencyDetail = ({ route }: AdminAgencyDetailProps) => {
  const agency = useAppSelector(agencyAdminSelectors.agency);
  const agencyUsersById = useAppSelector(
    connectedUsersAdminSelectors.agencyUsers,
  );

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      agencyAdminSlice.actions.fetchAgencyRequested(route.params.agencyId),
    );
    dispatch(
      connectedUsersAdminSlice.actions.fetchAgencyUsersRequested({
        agencyId: route.params.agencyId,
      }),
    );
    return () => {
      dispatch(agencyAdminSlice.actions.clearAgencyRequested());
    };
  }, [dispatch, route.params.agencyId]);

  if (!agency) return <Loader />;

  return (
    <>
      <AgencyOverview
        agency={agency}
        agencyUsers={agencyUsersById}
        routeName={route.name}
      />
      <AgencyDashboard agency={agency} />
    </>
  );
};
