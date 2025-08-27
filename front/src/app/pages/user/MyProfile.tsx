import { useEffect } from "react";
import { Loader } from "react-design-system";
import { useDispatch } from "react-redux";
import { UserProfile } from "src/app/components/user-profile/UserProfile";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import type { routes } from "src/app/routes/routes";
import { ENV } from "src/config/environmentVariables";
import { updateUserOnAgencySelectors } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.selectors";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import { feedbackSlice } from "src/core-logic/domain/feedback/feedback.slice";
import type { Route } from "type-route";

type MyProfileProps = {
  route: Route<typeof routes.myProfile>;
};

const linkToUpdateAccountInfo =
  ENV.envType === "production"
    ? "https://app.moncomptepro.beta.gouv.fr/personal-information"
    : "https://app-preprod.moncomptepro.beta.gouv.fr/personal-information";

export const MyProfile = (_: MyProfileProps) => {
  const dispatch = useDispatch();

  const currentUser = useAppSelector(connectedUserSelectors.currentUser);

  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);

  const isLoading = useAppSelector(updateUserOnAgencySelectors.isLoading);

  useEffect(() => {
    dispatch(feedbackSlice.actions.clearFeedbacksTriggered());
  }, [dispatch]);

  if (!currentUser || !connectedUserJwt)
    return <p>Vous n'êtes pas connecté...</p>;

  if (isLoading) {
    return <Loader />;
  }

  const userDisplayed =
    currentUser.firstName && currentUser.lastName
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : currentUser.email;

  return (
    <UserProfile
      title={userDisplayed}
      currentUser={currentUser}
      userWithRights={currentUser}
      editInformationsLink={linkToUpdateAccountInfo}
    />
  );
};
