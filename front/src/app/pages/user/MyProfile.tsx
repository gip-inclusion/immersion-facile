import { useEffect } from "react";
import { Loader } from "react-design-system";
import { useDispatch } from "react-redux";
import type { UserParamsForAgency } from "shared";
import { UserProfile } from "src/app/components/user-profile/UserProfile";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import type { routes } from "src/app/routes/routes";
import { ENV } from "src/config/environmentVariables";
import { updateUserOnAgencySelectors } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.selectors";
import { updateUserOnAgencySlice } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.slice";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { feedbackSlice } from "src/core-logic/domain/feedback/feedback.slice";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
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

  const currentUser = useAppSelector(inclusionConnectedSelectors.currentUser);

  const userConnectedJwt = useAppSelector(authSelectors.inclusionConnectToken);

  const isLoading = useAppSelector(updateUserOnAgencySelectors.isLoading);

  useEffect(() => {
    dispatch(feedbackSlice.actions.clearFeedbacksTriggered());
  }, [dispatch]);

  if (!currentUser || !userConnectedJwt)
    return <p>Vous n'êtes pas connecté...</p>;

  if (isLoading) {
    return <Loader />;
  }

  const userDisplayed =
    currentUser.firstName && currentUser.lastName
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : currentUser.email;

  const onUserUpdateRequested = (userParamsForAgency: UserParamsForAgency) => {
    dispatch(
      updateUserOnAgencySlice.actions.updateUserAgencyRightRequested({
        ...userParamsForAgency,
        feedbackTopic: "user",
      }),
    );
  };

  return (
    <>
      <UserProfile
        title={userDisplayed}
        currentUser={currentUser}
        userWithRights={currentUser}
        editInformationsLink={linkToUpdateAccountInfo}
        onUserUpdateRequested={onUserUpdateRequested}
      />
    </>
  );
};
