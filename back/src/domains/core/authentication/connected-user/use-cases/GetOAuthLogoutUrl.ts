import {
  type AbsoluteUrl,
  type ConnectedUser,
  errors,
  type WithIdToken,
  withIdTokenSchema,
} from "shared";
import { useCaseBuilder } from "../../../useCaseBuilder";
import type { OAuthGateway } from "../port/OAuthGateway";

export type GetOAuthLogoutUrl = ReturnType<typeof makeGetOAuthLogoutUrl>;

export const makeGetOAuthLogoutUrl = useCaseBuilder("GetOAuthLogoutUrl")
  .withInput<WithIdToken>(withIdTokenSchema)
  .withOutput<AbsoluteUrl>()
  .withCurrentUser<ConnectedUser>()
  .withDeps<{ oAuthGateway: OAuthGateway }>()
  .build(async ({ inputParams, uow, deps: { oAuthGateway }, currentUser }) => {
    const ongoingOAuth = await uow.ongoingOAuthRepository.findByUserId(
      currentUser.id,
    );
    if (!ongoingOAuth) throw errors.auth.missingOAuth({});
    return oAuthGateway.getLogoutUrl({
      idToken: inputParams.idToken,
      state: ongoingOAuth.state,
    });
  });
