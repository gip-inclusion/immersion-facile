import {
  type AbsoluteUrl,
  type WithRedirectUri,
  withRedirectUriSchema,
} from "shared";
import { TransactionalUseCase } from "../../../UseCase";
import type { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../unit-of-work/ports/UnitOfWorkPerformer";
import type { UuidGenerator } from "../../../uuid-generator/ports/UuidGenerator";
import type { OAuthGateway } from "../port/OAuthGateway";

export class InitiateLoginByOAuth extends TransactionalUseCase<
  WithRedirectUri,
  AbsoluteUrl
> {
  protected inputSchema = withRedirectUriSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private uuidGenerator: UuidGenerator,
    private oAuthGateway: OAuthGateway,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    params: WithRedirectUri,
    uow: UnitOfWork,
  ): Promise<AbsoluteUrl> {
    const nonce = this.uuidGenerator.new();
    const state = this.uuidGenerator.new();

    await uow.ongoingOAuthRepository.save({
      fromUri: params.redirectUri,
      nonce,
      state,
      provider: "proConnect",
      usedAt: null,
    });

    return this.oAuthGateway.getLoginUrl({
      nonce,
      state,
    });
  }
}
