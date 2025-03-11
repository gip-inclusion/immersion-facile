import {
  type InclusionConnectedUser,
  type WithOptionalUserId,
  errors,
  withOptionalUserIdSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import type { DashboardGateway } from "../../core/dashboard/port/DashboardGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { throwIfNotAdmin } from "../helpers/authorization.helper";
import { getIcUserByUserId } from "../helpers/inclusionConnectedUser.helper";

export class GetInclusionConnectedUser extends TransactionalUseCase<
  WithOptionalUserId,
  InclusionConnectedUser,
  InclusionConnectedUser
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
    currentIcUser?: InclusionConnectedUser,
  ): Promise<InclusionConnectedUser> {
    if (!currentIcUser) throw errors.user.noJwtProvided();

    const currentUser = await uow.userRepository.getById(currentIcUser.id);
    if (params.userId) throwIfNotAdmin(currentUser);

    const userIdToFetch = params.userId ?? currentIcUser.id;

    const user = await uow.userRepository.getById(userIdToFetch);
    if (!user) throw errors.user.notFound({ userId: userIdToFetch });

    return getIcUserByUserId(
      uow,
      user.id,
      this.#dashboardGateway,
      this.#timeGateway,
    );
  }
}
