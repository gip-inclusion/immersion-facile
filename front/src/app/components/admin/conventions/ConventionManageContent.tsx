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
import { P, match } from "ts-pattern";
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
  const inclusionConnectedRole = useAppSelector(
    inclusionConnectedSelectors.userRoleForFetchedConvention,
  );

  const role: Role | undefined = match({
    name: route.name,
    inclusionConnectedRole,
  })
    .with(
      { name: "manageConvention" },
      () =>
        decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(
          jwtParams.jwt,
        ).role,
    )
    .with({ name: "manageConventionAdmin" }, (): Role => "backOffice")
    .with(
      {
        name: "manageConventionInclusionConnected",
        inclusionConnectedRole: P.not(P.nullish),
      },
      ({ inclusionConnectedRole }): Role =>
        inclusionConnectedRole === "agencyOwner"
          ? "validator"
          : inclusionConnectedRole,
    )
    .otherwise(() => undefined);

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
  if (!role)
    return <p>Vous n'êtes pas autorisé à accéder à cette convention</p>;
  if (!convention) return <p>Pas de convention correspondante trouvée</p>;

  return (
    <>
      <ConventionValidation convention={convention} />
      <ConventionManageActions
        jwtParams={jwtParams}
        convention={convention}
        role={role}
        submitFeedback={submitFeedback}
      />
      <NpsSection convention={convention} role={role} />
    </>
  );
};
