import { useEffect, useState } from "react";
import { immersionApplicationGateway } from "src/app/main";
import { decodeJwt } from "src/core-logic/adapters/decodeJwt";
import { ImmersionApplicationDto } from "src/shared/ImmersionApplicationDto";

export const useImmersionApplicationFromJwt = (jwtToken: string) => {
  const { applicationId, roles } = decodeJwt(jwtToken);

  const [immersionApplication, setImmersionApplication] =
    useState<ImmersionApplicationDto>();

  useEffect(() => {
    // TODO: switch to calling get() with the token instead of the applicationId once supported by the backend.
    immersionApplicationGateway
      .get(applicationId)
      .then(setImmersionApplication);
  }, [applicationId]);

  return { immersionApplication, roles };
};
