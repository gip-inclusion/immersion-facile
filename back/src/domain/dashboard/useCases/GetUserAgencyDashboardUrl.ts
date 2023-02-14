import { AbsoluteUrl, InclusionConnectJwtPayload } from "shared";
import { z } from "zod";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { DashboardGateway } from "../port/DashboardGateway";

export class GetUserAgencyDashboardUrl extends TransactionalUseCase<
  void,
  AbsoluteUrl,
  InclusionConnectJwtPayload
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private dashboardGateway: DashboardGateway,
    private timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
  }

  inputSchema = z.void();

  protected async _execute(
    _: void,
    uow: UnitOfWork,
    jwtPayload: InclusionConnectJwtPayload,
  ): Promise<AbsoluteUrl> {
    const { userId } = jwtPayload;
    const user = await uow.inclusionConnectedUserQueries.getById(userId);
    if (!user)
      throw new NotFoundError(`No user found with provided ID : ${userId}`);

    if (user.agencies.length === 0)
      throw new NotFoundError(`No agencies found for user with ID : ${userId}`);

    return this.dashboardGateway.getAgencyUrl(
      user.agencies[0].id,
      this.timeGateway.now(),
    );
  }
}
