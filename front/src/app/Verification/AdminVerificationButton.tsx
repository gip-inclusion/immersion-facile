import React from "react";
import { immersionApplicationGateway } from "src/app/main";
import { WithImmersionApplication } from "src/app/Verification/VerificationSharedTypes";
import { Button } from "src/components/Button";
import { ImmersionApplicationDto } from "src/shared/ImmersionApplicationDto";

const sendValidationRequest = async (
  immersionApplication: ImmersionApplicationDto,
) => {
  // TODO : admin verification validate logic
  console.log("TODO : admin verification validate logic");
};

export const AdminVerificationButton = ({
  immersionApplication,
}: WithImmersionApplication) => {
  const validationDisabled =
    !immersionApplication || immersionApplication.status !== "IN_REVIEW";

  return (
    <Button
      disable={validationDisabled}
      onSubmit={() => sendValidationRequest(immersionApplication!)}
    >
      Valider et envoyer la convention
    </Button>
  );
};
