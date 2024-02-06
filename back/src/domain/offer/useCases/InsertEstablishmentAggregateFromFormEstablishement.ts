import { WithFormEstablishmentDto, withFormEstablishmentSchema } from "shared";
import { getAddressAndPosition } from "../../../utils/address";
import { createLogger } from "../../../utils/logger";
import { notifyAndThrowErrorDiscord } from "../../../utils/notifyDiscord";
import { getNafAndNumberOfEmployee } from "../../../utils/siret";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { SiretGateway } from "../../sirene/ports/SirenGateway";
import { AddressGateway } from "../ports/AddressGateway";
import { makeEstablishmentAggregate } from "../service/makeEstablishmentAggregate";

const logger = createLogger(__filename);

// prettier-ignore
const makeLog = (siret: string) => (message: string) =>
  logger.info(
    `${new Date().toISOString()} - InsertEstablishmentAggregateFromForm - ${siret} - ${message}`,
  );

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
    // Remove existing aggregate that could have been inserted by another process (eg. La Bonne Boite)
    const establishment =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        formEstablishment.siret,
      );
    if (establishment) {
      await uow.establishmentAggregateRepository.delete(
        formEstablishment.siret,
      );
      log("Cleared existing Aggregate");
    }

    const establishmentAggregate = await makeEstablishmentAggregate({
      uuidGenerator: this.uuidGenerator,
      timeGateway: this.timeGateway,
      nafAndNumberOfEmployee: await getNafAndNumberOfEmployee(
        this.siretGateway,
        formEstablishment.siret,
      ),
      addressesAndPosition: await Promise.all(
        formEstablishment.businessAddresses.map(async (address) =>
          getAddressAndPosition(
            this.addressAPI,
            formEstablishment.siret,
            address,
          ),
        ),
      ),
      formEstablishment,
    });

    log("Aggregate Ready");
    log(`About to save : ${JSON.stringify(establishmentAggregate, null, 2)}`);

    await uow.establishmentAggregateRepository
      .insertEstablishmentAggregates([establishmentAggregate])
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
      payload: { establishmentAggregate },
    });
    log(`About to save event ${event.id}`);
    await uow.outboxRepository.save(event);
    log("Event saved");
  }
}
