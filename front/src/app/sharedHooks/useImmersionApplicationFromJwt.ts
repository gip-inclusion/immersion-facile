import { useEffect, useState } from "react";
import { immersionApplicationGateway } from "src/app/dependencies";
import { decodeJwt } from "src/core-logic/adapters/decodeJwt";
import { ImmersionApplicationDto } from "src/shared/ImmersionApplicationDto";

export const useImmersionApplicationFromJwt = (jwt: string) => {
  const { roles, applicationId } = decodeJwt(jwt);
  let error: any | null = null;
  let [needsMagicLinkRefresh, setNeedsMagicLinkRefresh] = useState(false);

  const [immersionApplication, setImmersionApplication] =
    useState<ImmersionApplicationDto>();

  useEffect(() => {
    immersionApplicationGateway
      .getML(jwt)
      .then(setImmersionApplication)
      .catch((e) => {
        setNeedsMagicLinkRefresh(
          e.response.status === 403 && e.response.data.needsNewMagicLink,
        );
        error = e;
      });
  }, [jwt]);

  return {
    immersionApplication,
    roles,
    applicationId,
    jwt,
    error,
    needsMagicLinkRefresh,
  };
};
