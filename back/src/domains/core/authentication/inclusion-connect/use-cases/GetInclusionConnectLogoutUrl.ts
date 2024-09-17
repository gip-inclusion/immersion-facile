import { AbsoluteUrl, WithIdToken, withIdTokenSchema } from "shared";
import { TransactionalUseCase } from "../../../UseCase";
import { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../../unit-of-work/ports/UnitOfWorkPerformer";
import {
  OAuthGateway,
  oAuthProviderByFeatureFlags,
} from "../port/OAuthGateway";

export class GetInclusionConnectLogoutUrl extends TransactionalUseCase<
  WithIdToken,
  AbsoluteUrl
> {
  protected inputSchema = withIdTokenSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private oAuthGateway: OAuthGateway,
  ) {
    super(uowPerformer);
  }

  public async _execute(
    params: WithIdToken,
    uow: UnitOfWork,
  ): Promise<AbsoluteUrl> {
    return this.oAuthGateway.getLogoutUrl(
      params,
      oAuthProviderByFeatureFlags(await uow.featureFlagRepository.getAll()),
    );
  }
}
