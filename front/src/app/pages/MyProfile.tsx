import { AbsoluteUrl } from "shared";
import { UserDetail } from "src/app/components/UserDetail";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { ENV } from "src/config/environmentVariables";
import { featureFlagSelectors } from "src/core-logic/domain/featureFlags/featureFlags.selector";
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
  const { enableProConnect } = useAppSelector(
    featureFlagSelectors.featureFlagState,
  );

  const currentUser = useAppSelector(inclusionConnectedSelectors.currentUser);

  if (!currentUser) return <p>Vous n'êtes pas connecté...</p>;

  const userDisplayed =
    currentUser.firstName && currentUser.lastName
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : currentUser.email;

  return (
    <UserDetail
      title={`Mon profil : ${userDisplayed}`}
      userWithRights={currentUser}
      editInformationsLink={getLinkToUpdateAccountInfo(
        enableProConnect.isActive,
      )}
    />
  );
};
