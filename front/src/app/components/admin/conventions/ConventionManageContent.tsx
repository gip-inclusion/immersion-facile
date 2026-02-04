import { useEffect } from "react";
import { Loader } from "react-design-system";
import { useDispatch } from "react-redux";
import {
  allAgencyRoles,
  type ConventionJwtPayload,
  decodeMagicLinkJwtWithoutSignatureCheck,
  expiredJwtErrorMessage,
  type Role,
  userHasEnoughRightsOnConvention,
  type WithConventionId,
} from "shared";
import { Feedback } from "src/app/components/feedback/Feedback";
import { useConvention } from "src/app/hooks/convention.hooks";
import { useFeedbackTopic } from "src/app/hooks/feedback.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { frontErrors } from "src/app/pages/error/front-errors";
import { useRoute } from "src/app/routes/routes";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { partnersErroredConventionSelectors } from "src/core-logic/domain/partnersErroredConvention/partnersErroredConvention.selectors";
import { partnersErroredConventionSlice } from "src/core-logic/domain/partnersErroredConvention/partnersErroredConvention.slice";
import { match } from "ts-pattern";
import { ShowConventionErrorOrRenewExpiredJwt } from "../../../pages/convention/ShowErrorOrRenewExpiredJwt";
import { NpsSection } from "../../nps/NpsSection";
import {
  ConventionManageActions,
  type JwtKindProps,
} from "./ConventionManageActions";
import { ConventionValidation } from "./ConventionValidation";

export const ConventionManageContent = ({
  conventionId,
  jwtParams,
}: WithConventionId & { jwtParams: JwtKindProps }): JSX.Element => {
  const route = useRoute();
  const userRolesForFetchedConvention = useAppSelector(
    connectedUserSelectors.userRolesForFetchedConvention,
  );
  const currentUser = useAppSelector(connectedUserSelectors.currentUser);
  const userRolesAreLoading = useAppSelector(connectedUserSelectors.isLoading);
  const conventionLastBroadcastFeedbackIsLoading = useAppSelector(
    partnersErroredConventionSelectors.isLoading,
  );
  const conventionFormFeedback = useFeedbackTopic("convention-form");
  const fetchConventionError =
    conventionFormFeedback?.level === "error" &&
    conventionFormFeedback.on === "fetch";

  const roles: Role[] = match({
    name: route.name,
    userRolesForFetchedConvention,
  })
    .with({ name: "manageConvention" }, (): Role[] => [
      decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(
        jwtParams.jwt,
      ).role,
    ])
    .with(
      { name: "adminConventionDetail" },
      ({ userRolesForFetchedConvention }): Role[] => [
        "back-office",
        ...userRolesForFetchedConvention,
      ],
    )
    .with(
      { name: "manageConventionConnectedUser" },
      ({ userRolesForFetchedConvention }): Role[] =>
        userRolesForFetchedConvention,
    )
    .otherwise((): Role[] => []);

  const { convention, isLoading } = useConvention({
    jwt: jwtParams.jwt,
    conventionId,
  });

  const userHasRightToGetLastBroadcastFeedback =
    currentUser &&
    convention &&
    userHasEnoughRightsOnConvention(currentUser, convention, [
      ...allAgencyRoles,
    ]);
  const dispatch = useDispatch();

  useEffect(
    () => () => {
      dispatch(conventionSlice.actions.clearFetchedConvention());
      dispatch(
        partnersErroredConventionSlice.actions.clearConventionLastBroadcastFeedback(),
      );
    },
    [dispatch],
  );

  useEffect(() => {
    if (userHasRightToGetLastBroadcastFeedback) {
      dispatch(
        partnersErroredConventionSlice.actions.fetchConventionLastBroadcastFeedbackRequested(
          {
            conventionId,
            jwt: jwtParams.jwt,
          },
        ),
      );
    }
  }, [
    conventionId,
    jwtParams.jwt,
    userHasRightToGetLastBroadcastFeedback,
    dispatch,
  ]);

  if (fetchConventionError) {
    if (
      !conventionFormFeedback?.message.includes(expiredJwtErrorMessage) &&
      currentUser?.email
    ) {
      throw frontErrors.convention.noRightsOnConvention({
        userEmail: currentUser.email,
        conventionId: conventionId,
      });
    }

    return (
      <ShowConventionErrorOrRenewExpiredJwt
        errorMessage={conventionFormFeedback?.message}
        jwt={jwtParams.jwt}
      />
    );
  }

  if (
    isLoading ||
    userRolesAreLoading ||
    conventionLastBroadcastFeedbackIsLoading
  )
    return <Loader />;
  if (!convention) return <p>Pas de convention correspondante trouvée</p>;
  if (!roles.length)
    return <p>Vous n'êtes pas autorisé à accéder à cette convention</p>;

  return (
    <>
      <Feedback topics={["convention-action-edit"]} className="fr-mb-4w" />
      <ConventionValidation
        convention={convention}
        jwtParams={jwtParams}
        roles={roles}
      />
      <ConventionManageActions
        jwtParams={jwtParams}
        convention={convention}
        roles={roles}
      />
      <NpsSection convention={convention} roles={roles} />
    </>
  );
};
