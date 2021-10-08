import React from "react";
import { WithImmersionApplication } from "src/app/Verification/VerificationSharedTypes";
import { Button } from "src/components/Button";
import { ImmersionApplicationDto } from "src/shared/ImmersionApplicationDto";

const rejectImmersionApplication = async (
  immersionApplication: ImmersionApplicationDto,
) => {
  console.log(
    "TODO : call useCase to mark refuse immersion application in backend",
  );
};

export const RejectApplicationButton = ({
  immersionApplication,
}: WithImmersionApplication) => (
  <Button
    level="secondary"
    disable={!immersionApplication}
    onSubmit={() => rejectImmersionApplication(immersionApplication!)}
  >
    Refuser l'immersion ...
  </Button>
);
