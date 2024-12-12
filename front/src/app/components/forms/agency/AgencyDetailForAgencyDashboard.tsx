import React, { useEffect } from "react";
import { Loader } from "react-design-system";
import { useDispatch } from "react-redux";
import { AgencyOverview } from "src/app/components/forms/agency/AgencyOverview";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { fetchAgencySelectors } from "src/core-logic/domain/agencies/fetch-agency/fetchAgency.selectors";
import { fetchAgencySlice } from "src/core-logic/domain/agencies/fetch-agency/fetchAgency.slice";
import { Route } from "type-route";

type AgencyDetailForAgencyDashboardProps = {
  route: Route<typeof routes.agencyDashboardAgencyDetails>;
};

export const AgencyDetailForAgencyDashboard = ({
  route,
}: AgencyDetailForAgencyDashboardProps) => {
  const agency = useAppSelector(fetchAgencySelectors.agency);
  const agencyUsersById = useAppSelector(fetchAgencySelectors.agencyUsers);
  const isFetchingAgency = useAppSelector(fetchAgencySelectors.isLoading);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      fetchAgencySlice.actions.fetchAgencyRequested({
        agencyId: route.params.agencyId,
        feedbackTopic: "agency-for-dashboard",
      }),
    );
    dispatch(
      fetchAgencySlice.actions.fetchAgencyUsersRequested({
        agencyId: route.params.agencyId,
        feedbackTopic: "agency-user-for-dashboard",
      }),
    );
    return () => {
      dispatch(fetchAgencySlice.actions.clearAgencyAndUsers());
    };
  }, [dispatch, route.params.agencyId]);

  if (!agency || isFetchingAgency) return <Loader />;

  return (
    <AgencyOverview
      agency={agency}
      agencyUsers={agencyUsersById}
      routeName={route.name}
    />
  );
};
