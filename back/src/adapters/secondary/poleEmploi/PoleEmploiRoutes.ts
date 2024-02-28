import { AbsoluteUrl, withAuthorizationHeaders } from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import { PoleEmploiConvention } from "../../../domains/convention/ports/PoleEmploiGateway";

export const getPeTestPrefix = (peApiUrl: AbsoluteUrl) =>
  ["https://api.peio.pe-qvr.fr", "https://api-r.es-qvr.fr"].includes(peApiUrl)
    ? "test"
    : "";

export type PoleEmploiRoutes = ReturnType<typeof createPoleEmploiRoutes>;

const poleEmploiConventionSchema: z.Schema<PoleEmploiConvention> = z.any();
export const createPoleEmploiRoutes = (peApiUrl: AbsoluteUrl) => {
  const peTestPrefix = getPeTestPrefix(peApiUrl);

  return defineRoutes({
    broadcastConvention: defineRoute({
      method: "post",
      url: `${peApiUrl}/partenaire/${peTestPrefix}immersion-pro/v2/demandes-immersion`,
      requestBodySchema: poleEmploiConventionSchema,
      ...withAuthorizationHeaders,
      responses: {
        200: z.literal(""),
      },
    }),
  });
};
