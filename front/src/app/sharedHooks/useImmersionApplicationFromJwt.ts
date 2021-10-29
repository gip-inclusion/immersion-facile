import { useEffect, useState } from "react";
import { immersionApplicationGateway } from "src/app/dependencies";
import { decodeJwt } from "src/core-logic/adapters/decodeJwt";
import { ImmersionApplicationDto } from "src/shared/ImmersionApplicationDto";

export const useImmersionApplicationFromJwt = (jwt: string) => {
  const { roles } = decodeJwt(jwt);

  const [immersionApplication, setImmersionApplication] =
    useState<ImmersionApplicationDto>();

  useEffect(() => {
    immersionApplicationGateway.getML(jwt).then(setImmersionApplication);
  }, [jwt]);

  return { immersionApplication, roles, jwt };
};
