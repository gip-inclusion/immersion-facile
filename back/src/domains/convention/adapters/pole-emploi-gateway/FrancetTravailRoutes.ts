import { AbsoluteUrl, withAuthorizationHeaders } from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import { FranceTravailConvention } from "../../ports/FranceTravailGateway";

export const getFtTestPrefix = (peApiUrl: AbsoluteUrl) =>
  ["https://api.peio.pe-qvr.fr", "https://api-r.es-qvr.fr"].includes(peApiUrl)
    ? "test"
    : "";

export type FrancetTravailRoutes = ReturnType<typeof createFranceTravailRoutes>;

const franceTravailConventionSchema: z.Schema<FranceTravailConvention> =
  z.any();
export const createFranceTravailRoutes = (peApiUrl: AbsoluteUrl) => {
  const ftTestPrefix = getFtTestPrefix(peApiUrl);

  return defineRoutes({
    broadcastConvention: defineRoute({
      method: "post",
      url: `${peApiUrl}/partenaire/${ftTestPrefix}immersion-pro/v2/demandes-immersion`,
      requestBodySchema: franceTravailConventionSchema,
      ...withAuthorizationHeaders,
      responses: {
        200: z.any(),
        201: z.any(),
        204: z.any(),
      },
    }),
  });
};
