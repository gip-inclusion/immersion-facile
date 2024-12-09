import React, { useEffect } from "react";
import { Loader } from "react-design-system";
import { useDispatch } from "react-redux";
import { AgencyOverview } from "src/app/components/forms/agency/AgencyOverview";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { agencyAdminSelectors } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.selectors";
import { agencyAdminSlice } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.slice";
import { icUsersAdminSelectors } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.selectors";
import { icUsersAdminSlice } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import { Route } from "type-route";

type AdminAgencyDetailProps = {
  route: Route<typeof routes.adminAgencyDetail>;
};

export const AdminAgencyDetail = ({ route }: AdminAgencyDetailProps) => {
  const agency = useAppSelector(agencyAdminSelectors.agency);
  const agencyUsersById = useAppSelector(icUsersAdminSelectors.agencyUsers);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      agencyAdminSlice.actions.setSelectedAgencyId(route.params.agencyId),
    );
    dispatch(
      icUsersAdminSlice.actions.fetchAgencyUsersRequested({
        agencyId: route.params.agencyId,
      }),
    );
    return () => {
      dispatch(agencyAdminSlice.actions.setAgency(null));
    };
  }, [dispatch, route.params.agencyId]);

  if (!agency) return <Loader />;

  return (
    <AgencyOverview
      agency={agency}
      agencyUsers={agencyUsersById}
      routeName={route.name}
    />
  );
};
