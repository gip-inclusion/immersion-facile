import { AbsoluteUrl, WithIdToken, withIdTokenSchema } from "shared";
import { TransactionalUseCase } from "../../../UseCase";
import { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../../unit-of-work/ports/UnitOfWorkPerformer";
import { OAuthGateway, oAuthModeByFeatureFlags } from "../port/OAuthGateway";

export class GetInclusionConnectLogoutUrl extends TransactionalUseCase<
  WithIdToken,
  AbsoluteUrl
> {
  protected inputSchema = withIdTokenSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private inclusionConnectGateway: OAuthGateway,
  ) {
    super(uowPerformer);
  }

  public async _execute(
    params: WithIdToken,
    uow: UnitOfWork,
  ): Promise<AbsoluteUrl> {
    return this.inclusionConnectGateway.getLogoutUrl(
      params,
      oAuthModeByFeatureFlags(await uow.featureFlagRepository.getAll()),
    );
  }
}
