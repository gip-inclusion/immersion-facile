import { z } from "zod";
import { AbsoluteUrl, InclusionConnectJwtPayload } from "shared";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
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
    jwtPayload?: InclusionConnectJwtPayload,
  ): Promise<AbsoluteUrl> {
    if (!jwtPayload) throw new ForbiddenError("No JWT token provided");
    const { userId } = jwtPayload;
    const user = await uow.inclusionConnectedUserRepository.getById(userId);
    if (!user)
      throw new NotFoundError(`No user found with provided ID : ${userId}`);

    const agencyRight = user.agencyRights.at(0);
    if (!agencyRight)
      throw new NotFoundError(`No agency found for user with ID : ${userId}`);

    if (agencyRight.role === "toReview")
      throw new ForbiddenError(
        `User with ID : ${userId} has not sufficient rights to access this dashboard`,
      );

    return this.dashboardGateway.getAgencyUrl(
      agencyRight.agency.id,
      this.timeGateway.now(),
    );
  }
}
