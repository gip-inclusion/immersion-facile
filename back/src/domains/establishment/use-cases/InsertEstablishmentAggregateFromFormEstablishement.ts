import {
  errors,
  type InclusionConnectedUser,
  type WithFormEstablishmentDto,
  withFormEstablishmentSchema,
} from "shared";
import { getNafAndNumberOfEmployee } from "../../../utils/siret";
import type { AddressGateway } from "../../core/address/ports/AddressGateway";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import { rejectsSiretIfNotAnOpenCompany } from "../../core/sirene/helpers/rejectsSiretIfNotAnOpenCompany";
import type { SiretGateway } from "../../core/sirene/ports/SiretGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import type { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
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

    const existingEstablishment =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        formEstablishment.siret,
      );

    if (existingEstablishment)
      throw errors.establishment.conflictError({
        siret: formEstablishment.siret,
      });

    await rejectsSiretIfNotAnOpenCompany(
      this.siretGateway,
      formEstablishment.siret,
    );

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
      formEstablishment: {
        ...formEstablishment,
        appellations:
          await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodesIfExist(
            formEstablishment.appellations.map(
              ({ appellationCode }) => appellationCode,
            ),
          ),
        businessNameCustomized:
          formEstablishment.businessNameCustomized?.trim().length === 0
            ? undefined
            : formEstablishment.businessNameCustomized,
      },
    });

    await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
      establishmentAggregate,
    );

    await uow.outboxRepository.save(
      this.createNewEvent({
        topic: "NewEstablishmentAggregateInsertedFromForm",
        payload: {
          establishmentAggregate,
          triggeredBy: {
            kind: "inclusion-connected",
            userId: currentUser.id,
          },
        },
      }),
    );
  }
}
