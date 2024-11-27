import { Button } from "@codegouvfr/react-dsfr/Button";
import React from "react";
import { Loader } from "react-design-system";
import { useDispatch } from "react-redux";
import { SiretDto } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { establishmentSelectors } from "src/core-logic/domain/establishmentPath/establishment.selectors";
import { establishmentSlice } from "src/core-logic/domain/establishmentPath/establishment.slice";

export const RenewEstablishmentMagicLinkButton = ({
  siret,
  id,
}: {
  siret: SiretDto;
  id: string;
}) => {
  const dispatch = useDispatch();
  const isLoading = useAppSelector(establishmentSelectors.isLoading);
  const feedback = useAppSelector(establishmentSelectors.feedback);
  return (
    <>
      {isLoading && <Loader />}
      <Button
        priority="secondary"
        size="small"
        id={id}
        onClick={() => {
          dispatch(
            establishmentSlice.actions.sendModificationLinkRequested(siret),
          );
        }}
        disabled={feedback.kind === "sendModificationLinkSuccess"}
      >
        {feedback.kind === "sendModificationLinkSuccess"
          ? "Un nouveau lien vient d'être envoyé par email au responsable de cette entreprise"
          : "Renvoyer le lien de modification de cette entreprise"}
      </Button>
    </>
  );
};
