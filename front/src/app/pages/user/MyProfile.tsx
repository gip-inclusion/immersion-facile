import React, { useEffect } from "react";
import { Loader } from "react-design-system";
import { useDispatch } from "react-redux";
import { AbsoluteUrl, UserParamsForAgency } from "shared";
import { UserProfile } from "src/app/components/user-profile/UserProfile";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { ENV } from "src/config/environmentVariables";
import { updateUserOnAgencySelectors } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.selectors";
import { updateUserOnAgencySlice } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.slice";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { featureFlagSelectors } from "src/core-logic/domain/featureFlags/featureFlags.selector";
import { feedbackSlice } from "src/core-logic/domain/feedback/feedback.slice";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import { Route } from "type-route";

type MyProfileProps = {
  route: Route<typeof routes.myProfile>;
};

const getLinkToUpdateAccountInfo = (isProConnect: boolean): AbsoluteUrl => {
  if (ENV.envType === "production") {
    if (isProConnect)
      return "https://app.moncomptepro.beta.gouv.fr/personal-information";
    return "https://connect.inclusion.beta.gouv.fr/accounts/my-account";
  }

  if (isProConnect)
    return "https://app-preprod.moncomptepro.beta.gouv.fr/personal-information";
  return "https://recette.connect.inclusion.beta.gouv.fr/accounts/my-account";
};

export const MyProfile = (_: MyProfileProps) => {
  const dispatch = useDispatch();
  const { enableProConnect } = useAppSelector(
    featureFlagSelectors.featureFlagState,
  );

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
        title={`Mon profil : ${userDisplayed}`}
        currentUser={currentUser}
        userWithRights={currentUser}
        editInformationsLink={getLinkToUpdateAccountInfo(
          enableProConnect.isActive,
        )}
        onUserUpdateRequested={onUserUpdateRequested}
      />
    </>
  );
};
