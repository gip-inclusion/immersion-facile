import {
  AbsoluteUrl,
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
    return oAuthGateway.getLogoutUrl(
      { idToken: inputParams.idToken, state: ongoingOAuth.state },
      ongoingOAuth.provider,
    );
  },
);
