import {
  AgencyId,
  InclusionConnectDomainJwtPayload,
  agencyIdsSchema,
} from "shared";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class RegisterAgencyToInclusionConnectUser extends TransactionalUseCase<
  AgencyId[],
  void,
  InclusionConnectDomainJwtPayload
> {
  protected inputSchema = agencyIdsSchema;

  #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
  }

  protected async _execute(
    agencyIds: AgencyId[],
    uow: UnitOfWork,
    inclusionConnectedPayload: InclusionConnectDomainJwtPayload,
  ): Promise<void> {
    if (!inclusionConnectedPayload)
      throw new ForbiddenError("No JWT token provided");

    const user = await uow.inclusionConnectedUserRepository.getById(
      inclusionConnectedPayload.userId,
    );
    if (!user)
      throw new NotFoundError(
        `User not found with id: ${inclusionConnectedPayload.userId}`,
      );
    if (user.agencyRights.length > 0) {
      throw new BadRequestError(
        `This user (userId: ${user.id}), already has agencies rights.`,
      );
    }

    const agencies = await uow.agencyRepository.getByIds(agencyIds);
    if (agencies.length !== agencyIds.length) {
      const agenciesFoundMessage = agencies.length
        ? `Found only : ${agencies.map((agency) => agency.id).join(", ")}.`
        : "No agencies found.";

      throw new NotFoundError(
        [
          `Some agencies not found with ids : ${agencyIds.join(", ")}. `,
          agenciesFoundMessage,
        ].join(""),
      );
    }

    const event = this.#createNewEvent({
      topic: "AgencyRegisteredToInclusionConnectedUser",
      payload: {
        userId: user.id,
        agencyIds,
        triggeredBy: {
          kind: "inclusion-connected",
          userId: user.id,
        },
      },
    });

    await Promise.all([
      uow.inclusionConnectedUserRepository.updateAgencyRights({
        userId: user.id,
        agencyRights: agencies.map((agency) => ({
          agency,
          roles: ["toReview"],
          isNotifiedByEmail: false,
        })),
      }),
      uow.outboxRepository.save(event),
    ]);
  }
}
