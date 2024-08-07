import React, { useEffect } from "react";
import { Loader } from "react-design-system";
import { useDispatch } from "react-redux";
import {
  ConventionJwtPayload,
  Role,
  WithConventionId,
  decodeMagicLinkJwtWithoutSignatureCheck,
  expiredMagicLinkErrorMessage,
} from "shared";
import { useConvention } from "src/app/hooks/convention.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes, useRoute } from "src/app/routes/routes";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import { match } from "ts-pattern";
import { NpsSection } from "../../nps/NpsSection";
import {
  ConventionManageActions,
  JwtKindProps,
} from "./ConventionManageActions";
import { ConventionValidation } from "./ConventionValidation";

export const ConventionManageContent = ({
  conventionId,
  jwtParams,
}: WithConventionId & { jwtParams: JwtKindProps }): JSX.Element => {
  const route = useRoute();
  const inclusionConnectedRoles = useAppSelector(
    inclusionConnectedSelectors.userRolesForFetchedConvention,
  );
  const roles: Role[] = match({
    name: route.name,
    inclusionConnectedRoles,
  })
    .with({ name: "manageConvention" }, (): Role[] => [
      decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(
        jwtParams.jwt,
      ).role,
    ])
    .with(
      { name: "manageConventionAdmin" },
      ({ inclusionConnectedRoles }): Role[] => [
        "backOffice",
        ...inclusionConnectedRoles,
      ],
    )
    .with(
      { name: "manageConventionInclusionConnected" },
      ({ inclusionConnectedRoles }): Role[] => inclusionConnectedRoles,
    )
    .otherwise((): Role[] => []);

  const { convention, fetchConventionError, submitFeedback, isLoading } =
    useConvention({ jwt: jwtParams.jwt, conventionId });

  const dispatch = useDispatch();

  useEffect(
    () => () => {
      dispatch(conventionSlice.actions.clearFetchedConvention());
    },
    [dispatch],
  );

  if (fetchConventionError) {
    if (!fetchConventionError.includes(expiredMagicLinkErrorMessage)) {
      throw new Error(fetchConventionError);
    }
    routes
      .renewConventionMagicLink({
        expiredJwt: jwtParams.jwt,
        originalURL: window.location.href,
      })
      .replace();
  }

  if (isLoading) return <Loader />;
  if (!convention) return <p>Pas de convention correspondante trouvée</p>;
  if (!roles.length)
    return <p>Vous n'êtes pas autorisé à accéder à cette convention</p>;

  return (
    <>
      <ConventionValidation convention={convention} />
      <ConventionManageActions
        jwtParams={jwtParams}
        convention={convention}
        roles={roles}
        submitFeedback={submitFeedback}
      />
      <NpsSection convention={convention} roles={roles} />
    </>
  );
};
