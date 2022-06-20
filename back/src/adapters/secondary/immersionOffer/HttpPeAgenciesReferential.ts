import { AxiosInstance } from "axios";
import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { AccessTokenGateway } from "../../../domain/core/ports/AccessTokenGateway";
import {
  PeAgenciesReferential,
  PeAgencyFromReferenciel,
} from "../../../domain/immersionOffer/ports/PeAgenciesReferential";
import { createAxiosInstance } from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class HttpPeAgenciesReferential implements PeAgenciesReferential {
  private axios: AxiosInstance;
  private readonly referencielAgenceUrl: AbsoluteUrl;

  constructor(
    peApiUrl: AbsoluteUrl,
    private readonly accessTokenGateway: AccessTokenGateway,
    private readonly poleEmploiClientId: string,
  ) {
    this.axios = createAxiosInstance(logger);
    this.referencielAgenceUrl = `${peApiUrl}/partenaire/referentielagences/v1/agences`;
  }

  async getPeAgencies(): Promise<PeAgencyFromReferenciel[]> {
    const accessToken = await this.accessTokenGateway.getAccessToken(
      `application_${this.poleEmploiClientId} api_referentielagencesv1 organisationpe`,
    );

    if (!accessToken) throw new Error("No access token");

    const result = await this.axios.get(this.referencielAgenceUrl, {
      headers: {
        Authorization: `Bearer ${accessToken.access_token}`,
      },
    });

    if (!result) throw new Error("Something went wrong when fetching agencies");

    return result.data;
  }
}
