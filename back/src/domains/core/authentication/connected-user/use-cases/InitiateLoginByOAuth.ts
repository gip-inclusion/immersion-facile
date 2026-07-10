import {
  type AbsoluteUrl,
  type InitiateLoginByOAuthParams,
  initiateLoginByOAuthParamsSchema,
  type OAuthProviderForLogin,
} from "shared";
import { TransactionalUseCase } from "../../../UseCase";
import type { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../unit-of-work/ports/UnitOfWorkPerformer";
import type { UuidGenerator } from "../../../uuid-generator/ports/UuidGenerator";
import type { OAuthGateway } from "../port/OAuthGateway";

export type OAuthGatewayByProvider = Record<
  OAuthProviderForLogin,
  OAuthGateway
>;

export class InitiateLoginByOAuth extends TransactionalUseCase<
  InitiateLoginByOAuthParams,
  AbsoluteUrl
> {
  protected inputSchema = initiateLoginByOAuthParamsSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private uuidGenerator: UuidGenerator,
    private oAuthGateways: OAuthGatewayByProvider,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    params: InitiateLoginByOAuthParams,
    uow: UnitOfWork,
  ): Promise<AbsoluteUrl> {
    const nonce = this.uuidGenerator.new();
    const state = this.uuidGenerator.new();

    await uow.ongoingOAuthRepository.save({
      fromUri: params.redirectUri,
      nonce,
      state,
      provider: params.provider,
      idToken: null,
      usedAt: null,
    });

    return this.oAuthGateways[params.provider].getLoginUrl({
      nonce,
      state,
    });
  }
}
