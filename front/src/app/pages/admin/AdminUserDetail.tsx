import React, { useEffect } from "react";
import { Loader } from "react-design-system";
import { useDispatch } from "react-redux";
import { UserParamsForAgency } from "shared";
import { UserDetail } from "src/app/components/UserDetail";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { adminFetchUserSelectors } from "src/core-logic/domain/admin/fetchUser/fetchUser.selectors";
import { fetchUserSlice } from "src/core-logic/domain/admin/fetchUser/fetchUser.slice";
import { updateUserOnAgencySelectors } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.selectors";
import { updateUserOnAgencySlice } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.slice";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { feedbackSlice } from "src/core-logic/domain/feedback/feedback.slice";
import { Route } from "type-route";

type AdminUserDetailProps = {
  route: Route<typeof routes.adminUserDetail>;
};

export const AdminUserDetail = ({ route }: AdminUserDetailProps) => {
  const icUser = useAppSelector(adminFetchUserSelectors.fetchedUser);
  const isFetchingUser = useAppSelector(adminFetchUserSelectors.isFetching);
  const isUpdatingUser = useAppSelector(updateUserOnAgencySelectors.isLoading);
  const dispatch = useDispatch();

  const userConnectedJwt = useAppSelector(authSelectors.inclusionConnectToken);

  if (!userConnectedJwt)
    return <p>Merci de vous connecter pour accéder à cette page.</p>;

  const onUserUpdateRequested = (userParamsForAgency: UserParamsForAgency) => {
    dispatch(
      updateUserOnAgencySlice.actions.updateUserAgencyRightRequested({
        user: userParamsForAgency,
        jwt: userConnectedJwt,
        feedbackTopic: "user",
      }),
    );
  };

  useEffect(() => {
    dispatch(
      fetchUserSlice.actions.fetchUserRequested({
        userId: route.params.userId,
      }),
    );
  }, [route.params.userId, dispatch]);

  useEffect(() => {
    dispatch(feedbackSlice.actions.clearFeedbacksTriggered());
  }, [dispatch]);

  if (isFetchingUser || isUpdatingUser) return <Loader />;
  if (!icUser) return <p>Aucun utilisateur trouvé</p>;

  const title =
    icUser.firstName && icUser.lastName
      ? `${icUser.firstName} ${icUser.lastName}`
      : icUser.email;

  return (
    <UserDetail
      title={title}
      userWithRights={icUser}
      onUserUpdateRequested={onUserUpdateRequested}
    />
  );
};
