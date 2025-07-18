import {
  type AbsoluteUrl,
  errors,
  type User,
  type WithIdToken,
  withIdTokenSchema,
} from "shared";
import { useCaseBuilder } from "../../../useCaseBuilder";
import type { OAuthGateway } from "../port/OAuthGateway";

export type GetOAuthLogoutUrl = ReturnType<typeof makeGetOAuthLogoutUrl>;

export const makeGetOAuthLogoutUrl = useCaseBuilder("GetOAuthLogoutUrl")
  .withInput<WithIdToken>(withIdTokenSchema)
  .withOutput<AbsoluteUrl>()
  .withCurrentUser<User>()
  .withDeps<{ oAuthGateway: OAuthGateway }>()
  .build(async ({ inputParams, uow, deps: { oAuthGateway }, currentUser }) => {
    const ongoingOAuth = await uow.ongoingOAuthRepository.findByUserId(
      currentUser.id,
    );
    if (!ongoingOAuth) throw errors.proConnect.missingOAuth({});
    return oAuthGateway.getLogoutUrl({
      idToken: inputParams.idToken,
      state: ongoingOAuth.state,
    });
  });
