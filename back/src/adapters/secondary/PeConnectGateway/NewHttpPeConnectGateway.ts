import axios from "axios";
import { HttpClient } from "http-client";
import { AccessTokenDto } from "../../../domain/peConnect/dto/AccessToken.dto";
import { AllPeConnectAdvisorDto } from "../../../domain/peConnect/dto/PeConnectAdvisor.dto";
import { externalAccessTokenSchema } from "../../../domain/peConnect/port/AccessToken.schema";
import { PeConnectUserDto } from "../../../domain/peConnect/dto/PeConnectUser.dto";
import { PeConnectGateway } from "../../../domain/peConnect/port/PeConnectGateway";
import { AppConfig } from "../../primary/config/appConfig";
import { validateAndParseZodSchema } from "../../primary/helpers/httpErrors";
import { UnhandledError } from "../../primary/helpers/unhandledError";
import {
  toAccessToken,
  toPeConnectAdvisorDto,
  toPeConnectUserDto,
} from "./NewHttpgateway.mapper";
import {
  ExternalAccessToken,
  ExternalPeConnectAdvisor,
  externalPeConnectAdvisorsSchema,
  ExternalPeConnectUser,
  externalPeConnectUserSchema,
  externalPeConnectUserStatutSchema,
  PeConnectHeaders,
  PeConnectTargets,
  PeConnectTargetsKind,
} from "./PeConnectApi";
import { peConnectErrorStrategy } from "./peConnectErrorStrategy";

export class NewHttpPeConnectGateway implements PeConnectGateway {
  constructor(
    private httpClient: HttpClient<PeConnectTargets>,
    private appConfig: AppConfig,
  ) {}

  public async getAccessToken(
    authorizationCode: string,
  ): Promise<AccessTokenDto> {
    try {
      const result = await this.httpClient.oauth2Step2AccessToken({
        body: {
          client_id: this.appConfig.poleEmploiClientId,
          client_secret: this.appConfig.poleEmploiClientSecret,
          code: authorizationCode,
          grant_type: "authorization_code",
          redirect_uri: `${this.appConfig.immersionFacileBaseUrl}/api/pe-connect`,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const externalAccessToken: ExternalAccessToken =
        validateAndParseZodSchema(
          externalAccessTokenSchema,
          result.responseBody,
        );

      //const accessToken = toAccessToken(externalAccessToken);
      //const trackId = stringToMd5(accessToken.value);
      //logger.info({ trackId }, "PeConnect Get Access Token Success");

      return toAccessToken(externalAccessToken);
    } catch (error) {
      this.manageError(error, "oauth2Step2AccessToken");
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async getUserAndAdvisors(accessToken: AccessTokenDto): Promise<{
    user: PeConnectUserDto;
    advisors: AllPeConnectAdvisorDto[];
  }> {
    const headers: PeConnectHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken.value}`,
    };

    //getUserAndAdvisorsTotalCount.inc();
    const isUserJobseeker = await this.userIsJobseeker(headers);
    const [externalPeUser, externalPeConnectAdvisors] = await Promise.all([
      this.getUserInfo(headers),
      isUserJobseeker ? this.getAdvisorsInfo(headers) : [],
    ]);

    //getUserAndAdvisorsSuccessCount.inc();
    return {
      user: toPeConnectUserDto({ ...externalPeUser, isUserJobseeker }),
      advisors: externalPeConnectAdvisors.map(toPeConnectAdvisorDto),
    };
  }

  private async getUserInfo(
    headers: PeConnectHeaders,
  ): Promise<ExternalPeConnectUser> {
    try {
      const getUserInfoResponse = await this.httpClient.getUserInfo({
        headers,
      });
      return externalPeConnectUserSchema.parse(
        getUserInfoResponse.responseBody,
      );
    } catch (error) {
      this.manageError(error, "getUserInfo");
    }
  }

  private async userIsJobseeker(headers: PeConnectHeaders): Promise<boolean> {
    try {
      const getUserInfoResponse = await this.httpClient.getUserStatutInfo({
        headers,
      });
      const externalPeConnectStatut = externalPeConnectUserStatutSchema.parse(
        getUserInfoResponse.responseBody,
      );
      return externalPeConnectStatut.codeStatutIndividu === "1";
    } catch (error) {
      this.manageError(error, "getUserStatutInfo");
    }
  }

  private async getAdvisorsInfo(
    headers: PeConnectHeaders,
  ): Promise<ExternalPeConnectAdvisor[]> {
    return this.httpClient
      .getAdvisorsInfo({
        headers,
      })
      .then((response) =>
        externalPeConnectAdvisorsSchema.parse(response.responseBody),
      )
      .catch((error) => {
        if (axios.isAxiosError(error) && error.response?.status === 500)
          return Promise.resolve([]);
        this.manageError(error, "getAdvisorsInfo");
      });
  }

  private manageError(error: unknown, context: PeConnectTargetsKind): never {
    if (!(error instanceof Error))
      throw new Error(`Is not an error: ${JSON.stringify(error)}`);
    if (!axios.isAxiosError(error))
      throw new UnhandledError(`Non axios error - ${error.message}`, error);
    const selectedError = peConnectErrorStrategy(error, context).get(true);
    if (selectedError) throw selectedError;
    // eslint-disable-next-line no-console
    console.log("UNHANDLED AXIOS ERROR", error.toJSON());
    throw new UnhandledError("Erreur axios non gérée", error);
  }
}
