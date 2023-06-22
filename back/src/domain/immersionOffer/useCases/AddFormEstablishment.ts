import { FormEstablishmentDto, formEstablishmentSchema } from "shared";
import { ConflictError } from "../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { SiretGateway } from "../../sirene/ports/SirenGateway";
import { rejectsSiretIfNotAnOpenCompany } from "../../sirene/rejectsSiretIfNotAnOpenCompany";

export class AddFormEstablishment extends TransactionalUseCase<
  FormEstablishmentDto,
  void
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private createNewEvent: CreateNewEvent,
    private readonly siretGateway: SiretGateway,
  ) {
    super(uowPerformer);
  }

  inputSchema = formEstablishmentSchema;

  public async _execute(
    dto: FormEstablishmentDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const featureFlags = await uow.featureFlagRepository.getAll();

    const existingFormEstablishment =
      await uow.formEstablishmentRepository.getBySiret(dto.siret);

    if (existingFormEstablishment) {
      throw new ConflictError(
        `Establishment with siret ${dto.siret} already exists`,
      );
    }

    if (featureFlags.enableInseeApi) {
      await rejectsSiretIfNotAnOpenCompany(this.siretGateway, dto.siret);
    }

    const appellations =
      await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodes(
        dto.appellations.map(({ appellationCode }) => appellationCode),
      );

    const correctFormEstablishement: FormEstablishmentDto = {
      ...dto,
      appellations,
    };

    const event = this.createNewEvent({
      topic: "FormEstablishmentAdded",
      payload: correctFormEstablishement,
      ...(featureFlags.enableInseeApi ? {} : { wasQuarantined: true }),
    });

    await Promise.all([
      uow.formEstablishmentRepository.create(correctFormEstablishement),
      uow.outboxRepository.save(event),
    ]);
  }
}
