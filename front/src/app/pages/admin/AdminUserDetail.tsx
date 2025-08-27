import { useEffect } from "react";
import { Loader } from "react-design-system";
import { useDispatch } from "react-redux";
import { UserProfile } from "src/app/components/user-profile/UserProfile";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import type { routes } from "src/app/routes/routes";
import { adminFetchUserSelectors } from "src/core-logic/domain/admin/fetchUser/fetchUser.selectors";
import { fetchUserSlice } from "src/core-logic/domain/admin/fetchUser/fetchUser.slice";
import { updateUserOnAgencySelectors } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.selectors";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import { feedbackSlice } from "src/core-logic/domain/feedback/feedback.slice";
import type { Route } from "type-route";

type AdminUserDetailProps = {
  route: Route<typeof routes.adminUserDetail>;
};

export const AdminUserDetail = ({ route }: AdminUserDetailProps) => {
  const currentUser = useAppSelector(connectedUserSelectors.currentUser);
  const user = useAppSelector(adminFetchUserSelectors.fetchedUser);
  const isFetchingUser = useAppSelector(adminFetchUserSelectors.isFetching);
  const isUpdatingUser = useAppSelector(updateUserOnAgencySelectors.isLoading);
  const dispatch = useDispatch();

  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);

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

  if (!currentUser || !connectedUserJwt)
    return <p>Merci de vous connecter pour accéder à cette page.</p>;
  if (isFetchingUser || isUpdatingUser) return <Loader />;
  if (!user) return <p>Aucun utilisateur trouvé</p>;

  const title =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.email;

  return (
    <UserProfile
      title={title}
      currentUser={currentUser}
      userWithRights={user}
    />
  );
};
