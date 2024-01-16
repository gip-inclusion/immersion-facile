import { FormEstablishmentDto, formEstablishmentSchema } from "shared";
import { ConflictError } from "../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { SiretGateway } from "../../sirene/ports/SirenGateway";
import { rejectsSiretIfNotAnOpenCompany } from "../../sirene/rejectsSiretIfNotAnOpenCompany";

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
