import type { AxiosInstance } from "axios";
import { AbsoluteUrl } from "shared";
import { createAxiosInstance } from "../../../../utils/axiosUtils";
import { createLogger } from "../../../../utils/logger";
import { PoleEmploiGateway } from "../../../convention/ports/PoleEmploiGateway";
import {
  PeAgenciesReferential,
  PeAgencyFromReferenciel,
} from "../../../establishment/ports/PeAgenciesReferential";

const logger = createLogger(__filename);

export class HttpPeAgenciesReferential implements PeAgenciesReferential {
  #axios: AxiosInstance;

  readonly #referencielAgenceUrl: AbsoluteUrl;

  constructor(
    peApiUrl: AbsoluteUrl,
    private readonly poleEmploiGateway: PoleEmploiGateway,
    private readonly poleEmploiClientId: string,
  ) {
    this.#axios = createAxiosInstance(logger);
    this.#referencielAgenceUrl = `${peApiUrl}/partenaire/referentielagences/v1/agences`;
  }

  public async getPeAgencies(): Promise<PeAgencyFromReferenciel[]> {
    const accessToken = await this.poleEmploiGateway.getAccessToken(
      `application_${this.poleEmploiClientId} api_referentielagencesv1 organisationpe`,
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
