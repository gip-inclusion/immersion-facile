import {
  FormEstablishmentDto,
  InclusionConnectedUser,
  WithFormEstablishmentDto,
  errors,
  withFormEstablishmentSchema,
} from "shared";
import { getNafAndNumberOfEmployee } from "../../../utils/siret";
import { TransactionalUseCase } from "../../core/UseCase";
import { AddressGateway } from "../../core/address/ports/AddressGateway";
import { TriggeredBy } from "../../core/events/events";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { rejectsSiretIfNotAnOpenCompany } from "../../core/sirene/helpers/rejectsSiretIfNotAnOpenCompany";
import { SiretGateway } from "../../core/sirene/ports/SiretGateway";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import { makeEstablishmentAggregate } from "../helpers/makeEstablishmentAggregate";

export class InsertEstablishmentAggregateFromForm extends TransactionalUseCase<
  WithFormEstablishmentDto,
  void,
  InclusionConnectedUser
> {
  protected inputSchema = withFormEstablishmentSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly siretGateway: SiretGateway,
    private readonly addressGateway: AddressGateway,
    private readonly uuidGenerator: UuidGenerator,
    private readonly timeGateway: TimeGateway,
    private readonly createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    { formEstablishment }: WithFormEstablishmentDto,
    uow: UnitOfWork,
    currentUser?: InclusionConnectedUser,
  ): Promise<void> {
    if (!currentUser) throw errors.user.noJwtProvided();

    const establishment =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        formEstablishment.siret,
      );

    if (establishment)
      throw errors.establishment.conflictError({
        siret: formEstablishment.siret,
      });

    await rejectsSiretIfNotAnOpenCompany(
      this.siretGateway,
      formEstablishment.siret,
    );

    const appellations =
      await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodesIfExist(
        formEstablishment.appellations.map(
          ({ appellationCode }) => appellationCode,
        ),
      );

    const correctFormEstablishment: FormEstablishmentDto = {
      ...formEstablishment,
      appellations,
      businessNameCustomized:
        formEstablishment.businessNameCustomized?.trim().length === 0
          ? undefined
          : formEstablishment.businessNameCustomized,
    };

    await this.next(uow, correctFormEstablishment, {
      kind: "inclusion-connected",
      userId: currentUser.id,
    });
  }

  private async next(
    uow: UnitOfWork,
    formEstablishment: FormEstablishmentDto,
    triggeredBy: TriggeredBy | null,
  ) {
    const establishmentAggregate = await makeEstablishmentAggregate({
      uow,
      timeGateway: this.timeGateway,
      addressGateway: this.addressGateway,
      uuidGenerator: this.uuidGenerator,
      score: 0,
      nafAndNumberOfEmployee: await getNafAndNumberOfEmployee(
        this.siretGateway,
        formEstablishment.siret,
      ),
      formEstablishment,
    });

    await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
      establishmentAggregate,
    );

    await uow.outboxRepository.save(
      this.createNewEvent({
        topic: "NewEstablishmentAggregateInsertedFromForm",
        payload: {
          establishmentAggregate,
          triggeredBy,
        },
      }),
    );
  }
}
