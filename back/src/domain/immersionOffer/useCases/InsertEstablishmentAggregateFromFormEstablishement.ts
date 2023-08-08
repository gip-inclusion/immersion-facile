import { FormEstablishmentDto, formEstablishmentSchema } from "shared";
import { createLogger } from "../../../utils/logger";
import { makeFormEstablishmentToEstablishmentAggregate } from "../../../utils/makeFormEstablishmentToEstablishmentAggregate";
import { notifyAndThrowErrorDiscord } from "../../../utils/notifyDiscord";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { TransactionalUseCase } from "../../core/UseCase";
import { SiretGateway } from "../../sirene/ports/SirenGateway";
import { AddressGateway } from "../ports/AddressGateway";

const logger = createLogger(__filename);

// prettier-ignore
const makeLog = (siret: string) => (message: string) =>
  logger.info(`${new Date().toISOString()} - InsertEstablishmentAggregateFromForm - ${siret} - ${message}`);

export class InsertEstablishmentAggregateFromForm extends TransactionalUseCase<
  FormEstablishmentDto,
  void
> {
  protected inputSchema = formEstablishmentSchema;

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
    formEstablishment: FormEstablishmentDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const log = makeLog(formEstablishment.siret);

    log("Start");
    // Remove existing aggregate that could have been inserted by another process (eg. La Bonne Boite)
    const establishlment =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        formEstablishment.siret,
      );
    if (establishlment) {
      await uow.establishmentAggregateRepository.delete(
        formEstablishment.siret,
      );
      log("Cleared existing Aggregate");
    }

    const establishmentAggregate =
      await makeFormEstablishmentToEstablishmentAggregate({
        siretGateway: this.siretGateway,
        addressGateway: this.addressAPI,
        uuidGenerator: this.uuidGenerator,
        timeGateway: this.timeGateway,
      })(formEstablishment);

    log(
      establishmentAggregate ? "Aggregate Ready" : "Could not create aggregate",
    );

    if (!establishmentAggregate) return;

    log("About to save : " + JSON.stringify(establishmentAggregate, null, 2));

    await uow.establishmentAggregateRepository
      .insertEstablishmentAggregates([establishmentAggregate])
      .catch((err: any) => {
        notifyAndThrowErrorDiscord(
          new Error(
            `Error when adding establishment aggregate with siret ${formEstablishment.siret} due to ${err}`,
          ),
        );
      });

    log("Saved");

    const event = this.createNewEvent({
      topic: "NewEstablishmentAggregateInsertedFromForm",
      payload: establishmentAggregate,
    });
    log("About to save event " + event.id);
    await uow.outboxRepository.save(event);
    log("Event saved");
  }
}
