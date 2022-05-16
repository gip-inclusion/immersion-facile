import { AxiosInstance } from "axios";
import { AccessTokenGateway } from "../../../domain/core/ports/AccessTokenGateway";
import {
  PeAgenciesReferential,
  PeAgencyFromReferenciel,
} from "../../../domain/immersionOffer/ports/PeAgenciesReferential";
import { createAxiosInstance } from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

const referencielAgenceUrl =
  "https://api.emploi-store.fr/partenaire/referentielagences/v1/agences";

export class HttpPeAgenciesReferential implements PeAgenciesReferential {
  private axios: AxiosInstance;

  constructor(
    private readonly accessTokenGateway: AccessTokenGateway,
    private readonly poleEmploiClientId: string,
  ) {
    this.axios = createAxiosInstance(logger);
  }

  async getPeAgencies(): Promise<PeAgencyFromReferenciel[]> {
    const accessToken = await this.accessTokenGateway.getAccessToken(
      `application_${this.poleEmploiClientId} api_referentielagencesv1 organisationpe`,
    );

    if (!accessToken) throw new Error("No access token");

    const result = await this.axios.get(referencielAgenceUrl + "", {
      headers: {
        Authorization: `Bearer ${accessToken.access_token}`,
      },
    });

    if (!result) throw new Error("Something went wrong when fetching agencies");

    return result.data;
  }
}
