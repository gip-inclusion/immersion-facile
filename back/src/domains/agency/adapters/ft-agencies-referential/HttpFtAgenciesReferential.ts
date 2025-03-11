import type { AxiosInstance } from "axios";
import type { AbsoluteUrl } from "shared";
import { createAxiosInstance } from "../../../../utils/axiosUtils";
import { createLogger } from "../../../../utils/logger";
import type { FranceTravailGateway } from "../../../convention/ports/FranceTravailGateway";
import type {
  FtAgenciesReferential,
  FtAgencyFromReferential,
} from "../../../establishment/ports/FtAgenciesReferential";

const logger = createLogger(__filename);

export class HttpFtAgenciesReferential implements FtAgenciesReferential {
  #axios: AxiosInstance;

  readonly #referencielAgenceUrl: AbsoluteUrl;

  constructor(
    ftApiUrl: AbsoluteUrl,
    private readonly franceTravailGateway: FranceTravailGateway,
    private readonly franceTravailClientId: string,
  ) {
    this.#axios = createAxiosInstance(logger);
    this.#referencielAgenceUrl = `${ftApiUrl}/partenaire/referentielagences/v1/agences`;
  }

  public async getFtAgencies(): Promise<FtAgencyFromReferential[]> {
    const accessToken = await this.franceTravailGateway.getAccessToken(
      `application_${this.franceTravailClientId} api_referentielagencesv1 organisationpe`,
    );

    if (!accessToken) throw new Error("No access token");

    const result = await this.#axios.get(this.#referencielAgenceUrl, {
      headers: {
        Authorization: `Bearer ${accessToken.access_token}`,
      },
    });

    if (!result) throw new Error("Something went wrong when fetching agencies");

    return result.data;
  }
}
