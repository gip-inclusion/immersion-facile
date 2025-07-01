import { useEffect } from "react";
import { Loader } from "react-design-system";
import { useDispatch } from "react-redux";
import type { UserParamsForAgency } from "shared";
import { UserProfile } from "src/app/components/user-profile/UserProfile";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import type { routes } from "src/app/routes/routes";
import { adminFetchUserSelectors } from "src/core-logic/domain/admin/fetchUser/fetchUser.selectors";
import { fetchUserSlice } from "src/core-logic/domain/admin/fetchUser/fetchUser.slice";
import { updateUserOnAgencySelectors } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.selectors";
import { updateUserOnAgencySlice } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.slice";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { feedbackSlice } from "src/core-logic/domain/feedback/feedback.slice";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import type { Route } from "type-route";

type AdminUserDetailProps = {
  route: Route<typeof routes.adminUserDetail>;
};

export const AdminUserDetail = ({ route }: AdminUserDetailProps) => {
  const currentUser = useAppSelector(inclusionConnectedSelectors.currentUser);
  const icUser = useAppSelector(adminFetchUserSelectors.fetchedUser);
  const isFetchingUser = useAppSelector(adminFetchUserSelectors.isFetching);
  const isUpdatingUser = useAppSelector(updateUserOnAgencySelectors.isLoading);
  const dispatch = useDispatch();

  const userConnectedJwt = useAppSelector(authSelectors.inclusionConnectToken);

  const onUserUpdateRequested = (userParamsForAgency: UserParamsForAgency) => {
    dispatch(
      updateUserOnAgencySlice.actions.updateUserAgencyRightRequested({
        ...userParamsForAgency,
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

  if (!currentUser || !userConnectedJwt)
    return <p>Merci de vous connecter pour accéder à cette page.</p>;
  if (isFetchingUser || isUpdatingUser) return <Loader />;
  if (!icUser) return <p>Aucun utilisateur trouvé</p>;

  const title =
    icUser.firstName && icUser.lastName
      ? `${icUser.firstName} ${icUser.lastName}`
      : icUser.email;

  return (
    <UserProfile
      title={title}
      currentUser={currentUser}
      userWithRights={icUser}
      onUserUpdateRequested={onUserUpdateRequested}
    />
  );
};
