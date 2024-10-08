import {
  WithFormEstablishmentDto,
  errors,
  withFormEstablishmentSchema,
} from "shared";
import { rawAddressToLocation } from "../../../utils/address";
import { createLogger } from "../../../utils/logger";
import { notifyAndThrowErrorDiscord } from "../../../utils/notifyDiscord";
import { getNafAndNumberOfEmployee } from "../../../utils/siret";
import { TransactionalUseCase } from "../../core/UseCase";
import { AddressGateway } from "../../core/address/ports/AddressGateway";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { SiretGateway } from "../../core/sirene/ports/SirenGateway";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import { makeEstablishmentAggregate } from "../helpers/makeEstablishmentAggregate";

const logger = createLogger(__filename);

// prettier-ignore
const makeLog = (siret: string) => (message: string) =>
  logger.info({
    message: `${new Date().toISOString()} - InsertEstablishmentAggregateFromForm - ${siret} - ${message}`,
  });

export class InsertEstablishmentAggregateFromForm extends TransactionalUseCase<
  WithFormEstablishmentDto,
  void
> {
  protected inputSchema = withFormEstablishmentSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly siretGateway: SiretGateway,
    private readonly addressAPI: AddressGateway,
    private readonly uuidGenerator: UuidGenerator,
    private readonly timeGateway: TimeGateway,
    private readonly createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    { formEstablishment }: WithFormEstablishmentDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const log = makeLog(formEstablishment.siret);

    log("Start");

    const establishment =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        formEstablishment.siret,
      );

    if (establishment)
      throw errors.establishment.conflictError({
        siret: formEstablishment.siret,
      });

    const establishmentAggregate = await makeEstablishmentAggregate({
      uuidGenerator: this.uuidGenerator,
      timeGateway: this.timeGateway,
      nafAndNumberOfEmployee: await getNafAndNumberOfEmployee(
        this.siretGateway,
        formEstablishment.siret,
      ),
      addressesAndPosition: await Promise.all(
        formEstablishment.businessAddresses.map(
          async (formEstablishmentAddress) =>
            rawAddressToLocation(
              this.addressAPI,
              formEstablishment.siret,
              formEstablishmentAddress,
            ),
        ),
      ),
      formEstablishment,
    });

    log("Aggregate Ready");
    log(`About to save : ${JSON.stringify(establishmentAggregate, null, 2)}`);

    await uow.establishmentAggregateRepository
      .insertEstablishmentAggregate(establishmentAggregate)
      .catch((err) => {
        notifyAndThrowErrorDiscord(
          new Error(
            `Error when adding establishment aggregate with siret ${formEstablishment.siret} due to ${err}`,
          ),
        );
      });

    log("Saved");

    const event = this.createNewEvent({
      topic: "NewEstablishmentAggregateInsertedFromForm",
      payload: { establishmentAggregate, triggeredBy: null },
    });
    log(`About to save event ${event.id}`);
    await uow.outboxRepository.save(event);
    log("Event saved");
  }
}
