import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Role } from "shared";
import { Loader } from "react-design-system";
import { ConventionValidation } from "src/app/components/admin/ConventionValidation";
import { useConvention } from "src/app/hooks/convention.hooks";
import { routes } from "src/app/routes/routes";
import {
  conventionSlice,
  FetchConventionRequestedPayload,
} from "src/core-logic/domain/convention/convention.slice";
import { NpsSection } from "../nps/NpsSection";
import { ConventionManageActions } from "./ConventionManageActions";

type ConventionManageContentProps = {
  role: Role;
} & FetchConventionRequestedPayload;

export const ConventionManageContent = ({
  conventionId,
  jwt,
  role,
}: ConventionManageContentProps): JSX.Element => {
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

  if (!isLoading) return <Loader />;
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
