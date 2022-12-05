import { createTargets, CreateTargets, HttpClient, Target } from "http-client";
import { AbsoluteUrl } from "shared";
import {
  InclusionAccessTokenResponse,
  inclusionAccessTokenResponseSchema,
  InclusionConnectGateway,
} from "../../../domain/inclusionConnect/port/InclusionConnectGateway";
import { InclusionConnectConfig } from "../../../domain/inclusionConnect/useCases/InitiateInclusionConnect";
import { validateAndParseZodSchema } from "../../primary/helpers/httpErrors";

export type InclusionConnectExternalTargets = CreateTargets<{
  inclusionConnectGetAccessToken: Target<{
    grant_type: "authorization_code";
    redirect_uri: AbsoluteUrl;
    client_id: string;
    client_secret: string;
    code: string;
  }>;
  inclusionConnectLogout: Target<
    void,
    { state: string; id_token_hint: string }
  >;
}>;

type InclusionConnectTargetsConfig = {
  inclusionConnectBaseUrl: AbsoluteUrl;
};

export const createInclusionConnectExternalTargets = ({
  inclusionConnectBaseUrl,
}: InclusionConnectTargetsConfig) =>
  createTargets<InclusionConnectExternalTargets>({
    // url should be of form: "https://{hostname}/realms/{realm-name}/protocol/openid-connect" then we add auth | token | logout,
    inclusionConnectGetAccessToken: {
      method: "POST",
      url: `${inclusionConnectBaseUrl}/token`,
    },
    inclusionConnectLogout: {
      method: "GET",
      url: `${inclusionConnectBaseUrl}/logout`,
    },
  });

export class HttpInclusionConnectGateway implements InclusionConnectGateway {
  constructor(
    private httpClient: HttpClient<InclusionConnectExternalTargets>,
    private inclusionConnectConfig: InclusionConnectConfig,
  ) {}

  async getAccessToken(code: string): Promise<InclusionAccessTokenResponse> {
    const { responseBody } =
      await this.httpClient.inclusionConnectGetAccessToken({
        body: {
          code,
          client_id: this.inclusionConnectConfig.clientId,
          client_secret: this.inclusionConnectConfig.clientSecret,
          redirect_uri: this.inclusionConnectConfig.immersionRedirectUri,
          grant_type: "authorization_code",
        },
      });

    return validateAndParseZodSchema(
      inclusionAccessTokenResponseSchema,
      responseBody,
    );
  }
}

// -> inclusionConnect button calls startInclusionConnectLogin (immersion)
// -> redirects to inclusionConnect (inclusion)
// -> when logged in, redirects to afterLoginRedirection (immersion)
// -> with code received we can get the access token by calling : inclusionConnectGetAccessToken (inclusion)
//    return is of type {
//      'access_token': <ACCESS_TOKEN>,
//      'token_type': 'Bearer',
//      'expires_in': 60,
//      'id_token': <ID_TOKEN>
//    }
// -> id_token is a JWT. The payload contains the OAuth data of type :
//     nonce : la valeur transmise lors de la requête initiale qu'il faut vérifier.
//     sub : l'identifiant unique de l'utilisateur que le FS doit conserver au cas où l'utilisateur change son adresse e-mail un jour (ce qui n'est pas encore possible pour le moment).
//     given_name : le prénom de l'utilisateur.
//     family_name : son nom de famille.
//     email : so
