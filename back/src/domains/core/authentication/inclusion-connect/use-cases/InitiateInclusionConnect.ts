import {
  type AbsoluteUrl,
  type WithSourcePage,
  withSourcePageSchema,
} from "shared";
import { TransactionalUseCase } from "../../../UseCase";
import type { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../unit-of-work/ports/UnitOfWorkPerformer";
import type { UuidGenerator } from "../../../uuid-generator/ports/UuidGenerator";
import type { OAuthGateway } from "../port/OAuthGateway";

export class InitiateInclusionConnect extends TransactionalUseCase<
  WithSourcePage,
  AbsoluteUrl
> {
  protected inputSchema = withSourcePageSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private uuidGenerator: UuidGenerator,
    private oAuthGateway: OAuthGateway,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    params: WithSourcePage,
    uow: UnitOfWork,
  ): Promise<AbsoluteUrl> {
    const nonce = this.uuidGenerator.new();
    const state = this.uuidGenerator.new();

    await uow.ongoingOAuthRepository.save({
      nonce,
      state,
      provider: "proConnect",
    });

    return this.oAuthGateway.getLoginUrl({
      ...params,
      nonce,
      state,
    });
  }
}
