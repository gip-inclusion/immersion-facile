import {
  type AbsoluteUrl,
  type ConnectedUser,
  errors,
  type LogoutQueryParams,
  logoutQueryParamsSchema,
} from "shared";
import { useCaseBuilder } from "../../../useCaseBuilder";
import type { FtConnectGateway } from "../../ft-connect/port/FtConnectGateway";
import type { OAuthGateway } from "../port/OAuthGateway";

export type GetOAuthLogoutUrl = ReturnType<typeof makeGetOAuthLogoutUrl>;

export const makeGetOAuthLogoutUrl = useCaseBuilder("GetOAuthLogoutUrl")
  .withInput<LogoutQueryParams>(logoutQueryParamsSchema)
  .withOutput<AbsoluteUrl>()
  .withCurrentUser<ConnectedUser | undefined>()
  .withDeps<{
    proConnectOAuthGateway: OAuthGateway;
    ftConnectGateway: FtConnectGateway;
  }>()
  .build(
    async ({
      inputParams,
      uow,
      deps: { proConnectOAuthGateway, ftConnectGateway },
      currentUser,
    }) => {
      if (inputParams.provider === "peConnect") {
        return ftConnectGateway.getLogoutUrl({
          idToken: inputParams.idToken,
          state: "NOT NECESSARY",
        });
      }

      if (!currentUser) throw errors.user.unauthorized();

      const ongoingOAuth = await uow.ongoingOAuthRepository.findByUserId(
        currentUser.id,
      );
      if (!ongoingOAuth) throw errors.auth.missingOAuth({});
      return proConnectOAuthGateway.getLogoutUrl({
        idToken: inputParams.idToken,
        state: ongoingOAuth.state,
      });
    },
  );
