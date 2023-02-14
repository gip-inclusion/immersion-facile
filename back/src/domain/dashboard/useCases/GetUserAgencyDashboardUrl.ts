import { AbsoluteUrl, InclusionConnectJwtPayload } from "shared";
import { z } from "zod";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class GetUserAgencyDashboardUrl extends TransactionalUseCase<
  void,
  AbsoluteUrl,
  InclusionConnectJwtPayload
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = z.void();

  protected async _execute(
    _: void,
    _uow: UnitOfWork,
    jwtPayload: InclusionConnectJwtPayload,
  ): Promise<AbsoluteUrl> {
    const dashboardUrl: AbsoluteUrl = `https://www.my-dashboard-url.com/${jwtPayload.userId}`;
    return Promise.resolve(dashboardUrl);
  }
}
