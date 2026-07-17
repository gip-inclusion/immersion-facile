import {
  type AbsoluteUrl,
  initiateLoginByOAuthParamsSchema,
  type OAuthProviderForLogin,
} from "shared";
import { useCaseBuilder } from "../../../useCaseBuilder";
import type { UuidGenerator } from "../../../uuid-generator/ports/UuidGenerator";
import type { OAuthGateway } from "../port/OAuthGateway";

export type OAuthGatewayByProvider = Record<
  OAuthProviderForLogin,
  OAuthGateway
>;

export type InitiateLoginByOAuth = ReturnType<typeof makeInitiateLoginByOAuth>;

type Deps = {
  uuidGenerator: UuidGenerator;
  oAuthGateways: OAuthGatewayByProvider;
};

export const makeInitiateLoginByOAuth = useCaseBuilder("InitiateLoginByOAuth")
  .withInput(initiateLoginByOAuthParamsSchema)
  .withOutput<AbsoluteUrl>()
  .withDeps<Deps>()
  .build(async ({ inputParams, uow, deps }) => {
    const nonce = deps.uuidGenerator.new();
    const state = deps.uuidGenerator.new();

    await uow.ongoingOAuthRepository.save({
      fromUri: inputParams.redirectUri,
      nonce,
      state,
      provider: inputParams.provider,
      idToken: null,
      usedAt: null,
    });

    return deps.oAuthGateways[inputParams.provider].getLoginUrl({
      nonce,
      state,
    });
  });
