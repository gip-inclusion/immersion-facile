import { AbsoluteUrl, WithSourcePage, withSourcePageSchema } from "shared";
import { TransactionalUseCase } from "../../../UseCase";
import { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../../unit-of-work/ports/UnitOfWorkPerformer";
import { UuidGenerator } from "../../../uuid-generator/ports/UuidGenerator";
import { OAuthGateway, makeProvider } from "../port/OAuthGateway";

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

    const provider = await makeProvider(uow);

    await uow.ongoingOAuthRepository.save({
      nonce,
      state,
      provider,
    });

    return this.oAuthGateway.getLoginUrl(
      {
        ...params,
        nonce,
        state,
      },
      provider,
    );
  }
}
