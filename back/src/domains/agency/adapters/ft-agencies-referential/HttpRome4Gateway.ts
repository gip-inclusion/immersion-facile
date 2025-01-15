import {
  AbsoluteUrl,
  AppellationDto,
  RomeDto,
  withAuthorizationHeaders,
} from "shared";
import { HttpClient, defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import { FranceTravailGateway } from "../../../convention/ports/FranceTravailGateway";

export type AppellationWithShortLabel = AppellationDto & {
  romeCode: string;
  appellationLabelShort: string;
};

interface Rome4Gateway {
  getAllRomes(): Promise<RomeDto[]>;
  getAllAppellations(): Promise<AppellationWithShortLabel[]>;
}

type Rome4Routes = ReturnType<typeof makeRome4Routes>;
export const makeRome4Routes = (ftApiUrl: AbsoluteUrl) =>
  defineRoutes({
    getRomes: defineRoute({
      method: "get",
      url: `${ftApiUrl}/partenaire/rome-metiers/v1/metiers/metier?champs=code,libelle`,
      ...withAuthorizationHeaders,
      responses: {
        200: z.array(z.object({ code: z.string(), libelle: z.string() })),
      },
    }),
    getAppellations: defineRoute({
      method: "get",
      url: `${ftApiUrl}/partenaire/rome-metiers/v1/metiers/appellation?champs=code,libelle,libelleCourt,metier(code)`,
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

export class HttpRome4Gateway implements Rome4Gateway {
  #httpClient: HttpClient<Rome4Routes>;
  #franceTravailGateway: FranceTravailGateway;
  #franceTravailClientId: string;

  constructor(
    httpClient: HttpClient<Rome4Routes>,
    franceTravailGateway: FranceTravailGateway,
    franceTravailClientId: string,
  ) {
    this.#httpClient = httpClient;
    this.#franceTravailGateway = franceTravailGateway;
    this.#franceTravailClientId = franceTravailClientId;
  }

  #getScope() {
    return `application_${this.#franceTravailClientId} api_rome-metiersv1 nomenclatureRome`;
  }

  public async getAllRomes(): Promise<RomeDto[]> {
    const { access_token } = await this.#franceTravailGateway.getAccessToken(
      this.#getScope(),
    );

    return this.#httpClient
      .getRomes({ headers: { authorization: `Bearer ${access_token}` } })
      .then(({ body }) =>
        body.map(({ libelle, code }) => ({
          romeLabel: libelle,
          romeCode: code,
        })),
      );
  }

  public async getAllAppellations(): Promise<AppellationWithShortLabel[]> {
    const { access_token } = await this.#franceTravailGateway.getAccessToken(
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
      );
  }
}
