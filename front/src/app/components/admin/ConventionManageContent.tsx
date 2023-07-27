import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { match, P } from "ts-pattern";
import {
  ConventionMagicLinkPayload,
  decodeMagicLinkJwtWithoutSignatureCheck,
  Role,
} from "shared";
import { Loader } from "react-design-system";
import { ConventionValidation } from "src/app/components/admin/ConventionValidation";
import { useConvention } from "src/app/hooks/convention.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes, useRoute } from "src/app/routes/routes";
import {
  conventionSlice,
  FetchConventionRequestedPayload,
} from "src/core-logic/domain/convention/convention.slice";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import { NpsSection } from "../nps/NpsSection";
import { ConventionManageActions } from "./ConventionManageActions";

export const ConventionManageContent = ({
  conventionId,
  jwt,
}: FetchConventionRequestedPayload): JSX.Element => {
  const route = useRoute();
  const inclusionConnectedRole = useAppSelector(
    inclusionConnectedSelectors.agencyRoleForFetchedConvention,
  );

  const role: Role | undefined = match({
    name: route.name,
    inclusionConnectedRole,
  })
    .with(
      { name: "manageConvention" },
      () =>
        decodeMagicLinkJwtWithoutSignatureCheck<ConventionMagicLinkPayload>(jwt)
          .role,
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
    useConvention({ jwt, conventionId });

  const dispatch = useDispatch();

  useEffect(
    () => () => {
      dispatch(conventionSlice.actions.clearFetchedConvention());
    },
    [],
  );

  if (fetchConventionError) {
    fetchConventionError.includes("Le lien magique est périmé")
      ? routes
          .renewConventionMagicLink({
            expiredJwt: jwt,
            originalURL: window.location.href,
          })
          .replace()
      : routes
          .errorRedirect({
            title: "Erreur lors de la récupération de la convention",
            message: fetchConventionError,
            kind: "",
          })
          .push();
  }
  if (isLoading) return <Loader />;
  if (!role) return <p>Pas de role correspondant</p>;
  if (!convention) return <p>Pas de conventions correspondante trouvée</p>;
  return (
    <>
      <ConventionValidation convention={convention} />
      <ConventionManageActions
        jwt={jwt}
        convention={convention}
        role={role}
        submitFeedback={submitFeedback}
      />
      <NpsSection convention={convention} role={role} />
    </>
  );
};
