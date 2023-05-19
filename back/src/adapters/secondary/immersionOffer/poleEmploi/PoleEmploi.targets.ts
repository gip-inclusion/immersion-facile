import { AbsoluteUrl, withValidateHeadersAuthorization } from "shared";
import { createTarget, createTargets } from "http-client";
import { PoleEmploiConvention } from "../../../../domain/convention/ports/PoleEmploiGateway";

export const getPeTestPrefix = (peApiUrl: AbsoluteUrl) =>
  ["https://api.peio.pe-qvr.fr", "https://api-r.es-qvr.fr"].includes(peApiUrl)
    ? "test"
    : "";

export type PoleEmploiTargets = ReturnType<typeof createPoleEmploiTargets>;
export const createPoleEmploiTargets = (peApiUrl: AbsoluteUrl) => {
  const peTestPrefix = getPeTestPrefix(peApiUrl);

  return createTargets({
    broadcastConvention: createTarget({
      method: "POST",
      url: `${peApiUrl}/partenaire/${peTestPrefix}immersion-pro/v2/demandes-immersion`,
      validateRequestBody: (body) => body as PoleEmploiConvention,
      ...withValidateHeadersAuthorization,
    }),
  });
};
