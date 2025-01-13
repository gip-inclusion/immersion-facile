import { AbsoluteUrl, withAuthorizationHeaders } from "shared";
import { HttpClient, defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import { createLogger } from "../../../../utils/logger";
import { FranceTravailGateway } from "../../../convention/ports/FranceTravailGateway";
import type { AppellationWithShortLabel } from "./HttpRome4Gateway";

const logger = createLogger(__filename);

interface Rome3Gateway {
  getAllAppellations(): Promise<AppellationWithShortLabel[]>;
}

type Rome4Routes = ReturnType<typeof makeRome3Routes>;
export const makeRome3Routes = (peApiUrl: AbsoluteUrl) =>
  defineRoutes({
    getAppellations: defineRoute({
      method: "get",
      url: `${peApiUrl}/partenaire/rome/v1/appellation?champs=code,libelle,libelleCourt,metier(code)`,
      ...withAuthorizationHeaders,
      responses: {
        200: z.array(
          z.object({
            code: z.string(),
            libelle: z.string(),
            libelleCourt: z.string(),
            metier: z.object({
              code: z.string(),
            }),
          }),
        ),
      },
    }),
  });

export class HttpRome3Gateway implements Rome3Gateway {
  #httpClient: HttpClient<Rome4Routes>;
  #poleEmploiGateway: FranceTravailGateway;
  #poleEmploiClientId: string;

  constructor(
    httpClient: HttpClient<Rome4Routes>,
    poleEmploiGateway: FranceTravailGateway,
    poleEmploiClientId: string,
  ) {
    this.#httpClient = httpClient;
    this.#poleEmploiGateway = poleEmploiGateway;
    this.#poleEmploiClientId = poleEmploiClientId;
  }

  #getScope() {
    return `application_${this.#poleEmploiClientId} api_romev1 nomenclatureRome`;
  }

  public async getAllAppellations(): Promise<AppellationWithShortLabel[]> {
    const { access_token } = await this.#poleEmploiGateway.getAccessToken(
      this.#getScope(),
    );

    return this.#httpClient
      .getAppellations({ headers: { authorization: `Bearer ${access_token}` } })
      .then(({ body }) =>
        body.map(({ code, libelle, libelleCourt, metier }) => ({
          romeCode: metier.code,
          appellationCode: code,
          appellationLabel: libelle,
          appellationLabelShort: libelleCourt,
        })),
      )
      .catch((error) => {
        logger.error({ message: "Error getting appellations", error });
        throw error;
      });
  }
}
