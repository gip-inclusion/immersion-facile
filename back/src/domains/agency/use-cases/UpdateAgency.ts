import {
  AgencyDto,
  InclusionConnectDomainJwtPayload,
  agencySchema,
} from "shared";
import {
  NotFoundError,
  UnauthorizedError,
} from "../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { getIcUserOrThrow } from "../../inclusion-connected-users/helpers/throwIfIcUserNotBackofficeAdmin";
import { throwConflictErrorOnSimilarAgencyFound } from "../entities/Agency";

export class UpdateAgency extends TransactionalUseCase<
  AgencyDto,
  void,
  InclusionConnectDomainJwtPayload
> {
  protected inputSchema = agencySchema;

  #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
  }

  public async _execute(
    agency: AgencyDto,
    uow: UnitOfWork,
    jwtPayload: InclusionConnectDomainJwtPayload,
  ): Promise<void> {
    if (!jwtPayload) throw new UnauthorizedError();

    const user = await getIcUserOrThrow(uow, jwtPayload.userId);

    if (!user.isBackofficeAdmin) {
      await throwConflictErrorOnSimilarAgencyFound({
        uow,
        agency,
      });
    }

    await uow.agencyRepository.update(agency).catch((error) => {
      if (error.message === `Agency ${agency.id} does not exist`) {
        throw new NotFoundError(`No agency found with id : ${agency.id}`);
      }
      throw error;
    });

    await uow.outboxRepository.save(
      this.#createNewEvent({
        topic: "AgencyUpdated",
        payload: { agency },
      }),
    );
  }
}
