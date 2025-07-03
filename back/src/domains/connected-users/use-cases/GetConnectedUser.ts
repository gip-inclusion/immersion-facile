import {
  type ConnectedUser,
  errors,
  type WithOptionalUserId,
  withOptionalUserIdSchema,
} from "shared";
import type { DashboardGateway } from "../../core/dashboard/port/DashboardGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { throwIfNotAdmin } from "../helpers/authorization.helper";
import { getConnectedUserByUserId } from "../helpers/connectedUser.helper";

export class GetConnectedUser extends TransactionalUseCase<
  WithOptionalUserId,
  ConnectedUser,
  ConnectedUser
> {
  protected inputSchema = withOptionalUserIdSchema;

  readonly #dashboardGateway: DashboardGateway;

  readonly #timeGateway: TimeGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    dashboardGateway: DashboardGateway,
    timeGateway: TimeGateway,
  ) {
    super(uowPerformer);

    this.#dashboardGateway = dashboardGateway;
    this.#timeGateway = timeGateway;
  }

  protected async _execute(
    params: WithOptionalUserId,
    uow: UnitOfWork,
    currentIcUser?: ConnectedUser,
  ): Promise<ConnectedUser> {
    if (!currentIcUser) throw errors.user.noJwtProvided();

    const currentUser = await uow.userRepository.getById(currentIcUser.id);
    if (params.userId) throwIfNotAdmin(currentUser);

    const userIdToFetch = params.userId ?? currentIcUser.id;

    return getConnectedUserByUserId({
      uow,
      userId: userIdToFetch,
      dashboardGateway: this.#dashboardGateway,
      timeGateway: this.#timeGateway,
    });
  }
}
