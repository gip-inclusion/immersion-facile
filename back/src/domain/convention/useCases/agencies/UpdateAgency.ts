import { AgencyDto, agencySchema, BackOfficeJwtPayload } from "shared";
import {
  NotFoundError,
  UnauthorizedError,
} from "../../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../../core/eventBus/EventBus";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { throwConflictErrorOnSimilarAgencyFound } from "../../entities/Agency";

export class UpdateAgency extends TransactionalUseCase<
  AgencyDto,
  void,
  BackOfficeJwtPayload
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
    jwtPayload: BackOfficeJwtPayload,
  ): Promise<void> {
    if (!jwtPayload) throw new UnauthorizedError();
    if (jwtPayload.role !== "backOffice") {
      await throwConflictErrorOnSimilarAgencyFound({ uow, agency });
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
