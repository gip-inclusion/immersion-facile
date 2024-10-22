import {
  AbsoluteUrl,
  IdentityProvider,
  OAuthGatewayProvider,
  User,
  WithIdToken,
  errors,
  withIdTokenSchema,
} from "shared";
import { createTransactionalUseCase } from "../../../UseCase";
import { OAuthGateway } from "../port/OAuthGateway";

export type GetInclusionConnectLogoutUrl = ReturnType<
  typeof makeGetInclusionConnectLogoutUrl
>;

export const makeGetInclusionConnectLogoutUrl = createTransactionalUseCase<
  WithIdToken,
  AbsoluteUrl,
  User,
  { oAuthGateway: OAuthGateway }
>(
  {
    name: "GetInclusionConnectLogoutUrl",
    inputSchema: withIdTokenSchema,
  },
  async ({ inputParams, uow, deps: { oAuthGateway }, currentUser }) => {
    const ongoingOAuth = await uow.ongoingOAuthRepository.findByUserId(
      currentUser.id,
    );
    if (!ongoingOAuth) throw errors.inclusionConnect.missingOAuth({});

    const provider = getProvider(ongoingOAuth.provider);

    return oAuthGateway.getLogoutUrl(
      { idToken: inputParams.idToken, state: ongoingOAuth.state },
      provider,
    );
  },
);

const getProvider = (
  identityProvider: IdentityProvider,
): OAuthGatewayProvider => {
  if (identityProvider === "inclusionConnect") return "InclusionConnect";
  if (identityProvider === "proConnect") return "ProConnect";
  throw new Error(`Unknown identityProvider : ${identityProvider}`);
};
