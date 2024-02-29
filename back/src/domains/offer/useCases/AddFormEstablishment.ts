import { FormEstablishmentDto, formEstablishmentSchema } from "shared";
import { ConflictError } from "../../../adapters/primary/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { rejectsSiretIfNotAnOpenCompany } from "../../core/sirene/helpers/rejectsSiretIfNotAnOpenCompany";
import { SiretGateway } from "../../core/sirene/ports/SirenGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class AddFormEstablishment extends TransactionalUseCase<FormEstablishmentDto> {
  protected inputSchema = formEstablishmentSchema;

  readonly #createNewEvent: CreateNewEvent;

  readonly #siretGateway: SiretGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
    siretGateway: SiretGateway,
  ) {
    super(uowPerformer);

    this.#createNewEvent = createNewEvent;
    this.#siretGateway = siretGateway;
  }

  protected async _execute(
    dto: FormEstablishmentDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const existingFormEstablishment =
      await uow.formEstablishmentRepository.getBySiret(dto.siret);

    if (existingFormEstablishment) {
      throw new ConflictError(
        `Establishment with siret ${dto.siret} already exists`,
      );
    }
    await rejectsSiretIfNotAnOpenCompany(this.#siretGateway, dto.siret);

    const appellations =
      await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodes(
        dto.appellations.map(({ appellationCode }) => appellationCode),
      );

    const correctFormEstablishment: FormEstablishmentDto = {
      ...dto,
      appellations,
      businessNameCustomized:
        dto.businessNameCustomized?.trim().length === 0
          ? undefined
          : dto.businessNameCustomized,
    };

    const event = this.#createNewEvent({
      topic: "FormEstablishmentAdded",
      payload: { formEstablishment: correctFormEstablishment },
    });

    await Promise.all([
      uow.formEstablishmentRepository.create(correctFormEstablishment),
      uow.outboxRepository.save(event),
    ]);
  }
}
