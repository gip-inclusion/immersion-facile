import {
  type AbsoluteUrl,
  errors,
  type User,
  type WithIdToken,
  withIdTokenSchema,
} from "shared";
import { createTransactionalUseCase } from "../../../UseCase";
import type { OAuthGateway } from "../port/OAuthGateway";

export type GetOAuthLogoutUrl = ReturnType<typeof makeGetOAuthLogoutUrl>;

export const makeGetOAuthLogoutUrl = createTransactionalUseCase<
  WithIdToken,
  AbsoluteUrl,
  User,
  { oAuthGateway: OAuthGateway }
>(
  {
    name: "GetOAuthLogoutUrl",
    inputSchema: withIdTokenSchema,
  },
  async ({ inputParams, uow, deps: { oAuthGateway }, currentUser }) => {
    const ongoingOAuth = await uow.ongoingOAuthRepository.findByUserId(
      currentUser.id,
    );
    if (!ongoingOAuth) throw errors.proConnect.missingOAuth({});
    return oAuthGateway.getLogoutUrl({
      idToken: inputParams.idToken,
      state: ongoingOAuth.state,
    });
  },
);
