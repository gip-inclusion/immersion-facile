import { AbsoluteUrl, WithIdToken, withIdTokenSchema } from "shared";
import { createTransactionalUseCase } from "../../../UseCase";
import {
  OAuthGateway,
  oAuthProviderByFeatureFlags,
} from "../port/OAuthGateway";

export type GetInclusionConnectLogoutUrl = ReturnType<
  typeof makeGetInclusionConnectLogoutUrl
>;

export const makeGetInclusionConnectLogoutUrl = createTransactionalUseCase<
  WithIdToken,
  AbsoluteUrl,
  void,
  { oAuthGateway: OAuthGateway }
>(
  {
    name: "GetInclusionConnectLogoutUrl",
    inputSchema: withIdTokenSchema,
  },
  async ({ inputParams, uow, deps: { oAuthGateway } }) => {
    return oAuthGateway.getLogoutUrl(
      inputParams,
      oAuthProviderByFeatureFlags(await uow.featureFlagRepository.getAll()),
    );
  },
);
