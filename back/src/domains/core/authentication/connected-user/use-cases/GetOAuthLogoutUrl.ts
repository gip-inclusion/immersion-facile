import {
  type AbsoluteUrl,
  errors,
  type LogoutQueryParams,
  logoutQueryParamsSchema,
  type User,
} from "shared";
import { useCaseBuilder } from "../../../useCaseBuilder";
import type { FtConnectGateway } from "../../ft-connect/port/FtConnectGateway";
import type { OAuthGateway } from "../port/OAuthGateway";

export type GetOAuthLogoutUrl = ReturnType<typeof makeGetOAuthLogoutUrl>;

export const makeGetOAuthLogoutUrl = useCaseBuilder("GetOAuthLogoutUrl")
  .withInput<LogoutQueryParams>(logoutQueryParamsSchema)
  .withOutput<AbsoluteUrl>()
  .withCurrentUser<User>()
  .withDeps<{
    oAuthGateway: OAuthGateway;
    ftConnectGateway: FtConnectGateway;
  }>()
  .build(
    async ({
      inputParams,
      uow,
      deps: { oAuthGateway, ftConnectGateway },
      currentUser,
    }) => {
      if (inputParams.provider === "peConnect") {
        return ftConnectGateway.getLogoutUrl({
          idToken: inputParams.idToken,
        });
      }

      const ongoingOAuth = await uow.ongoingOAuthRepository.findByUserId(
        currentUser.id,
      );
      if (!ongoingOAuth) throw errors.auth.missingOAuth({});
      return oAuthGateway.getLogoutUrl({
        idToken: inputParams.idToken,
        state: ongoingOAuth.state,
      });
    },
  );
