import { AbsoluteUrl, withAuthorizationHeaders } from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import { FranceTravailConvention } from "../../ports/FranceTravailGateway";

export const getFtTestPrefix = (ftApiUrl: AbsoluteUrl) =>
  ["https://api.peio.pe-qvr.fr", "https://api-r.es-qvr.fr"].includes(ftApiUrl)
    ? "test"
    : "";

export type FrancetTravailRoutes = ReturnType<typeof createFranceTravailRoutes>;

const franceTravailConventionSchema: z.Schema<FranceTravailConvention> =
  z.any();
export const createFranceTravailRoutes = (ftApiUrl: AbsoluteUrl) => {
  const ftTestPrefix = getFtTestPrefix(ftApiUrl);

  return defineRoutes({
    broadcastConvention: defineRoute({
      method: "post",
      url: `${ftApiUrl}/partenaire/${ftTestPrefix}immersion-pro/v2/demandes-immersion`,
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
