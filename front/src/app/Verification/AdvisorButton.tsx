import React from "react";
import { WithImmersionApplication } from "src/app/Verification/VerificationSharedTypes";
import { Button } from "src/components/Button";
import { ImmersionApplicationDto } from "src/shared/ImmersionApplicationDto";

const markImmersionApplicationAsLegit = async (
  immersionApplication: ImmersionApplicationDto,
) => {
  console.log(
    "TODO : call useCase to mark immersion application as legit in backend",
  );
};

export const AdvisorButton = ({
  immersionApplication,
}: WithImmersionApplication) => (
  <Button
    disable={!immersionApplication}
    onSubmit={() => markImmersionApplicationAsLegit(immersionApplication!)}
  >
    Marquer la demande comme légitime
  </Button>
);
