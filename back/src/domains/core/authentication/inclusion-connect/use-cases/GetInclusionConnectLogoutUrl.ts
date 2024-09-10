import { AbsoluteUrl } from "shared";
import { z } from "zod";
import { TransactionalUseCase } from "../../../UseCase";
import { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../../unit-of-work/ports/UnitOfWorkPerformer";
import { OAuthGateway, oAuthModeByFeatureFlags } from "../port/OAuthGateway";

export class GetInclusionConnectLogoutUrl extends TransactionalUseCase<
  void,
  AbsoluteUrl
> {
  protected inputSchema = withIdTokenSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private inclusionConnectGateway: OAuthGateway,
  ) {
    super(uowPerformer);
  }

  public async _execute(_: void, uow: UnitOfWork): Promise<AbsoluteUrl> {
    return this.inclusionConnectGateway.getLogoutUrl(
      oAuthModeByFeatureFlags(await uow.featureFlagRepository.getAll()),
    );
  }
}
