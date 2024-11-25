import { z } from "zod";
import { UseCase } from "../../../core/UseCase";
import { WithEstablishmentAggregate } from "../../entities/EstablishmentAggregate";
import {
  PassEmploiGateway,
  PassEmploiNotificationParams,
} from "../../ports/PassEmploiGateway";

// No need of a validation schema here since this use-case is only called from the our domain
const establishmentAggregateSchema: z.Schema<WithEstablishmentAggregate> =
  z.any();

export class NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm extends UseCase<WithEstablishmentAggregate> {
  protected inputSchema = establishmentAggregateSchema;

  constructor(private passEmploiGateway: PassEmploiGateway) {
    super();
  }

  public async _execute({
    establishmentAggregate,
  }: WithEstablishmentAggregate): Promise<void> {
    const notificationParams: PassEmploiNotificationParams = {
      immersions: establishmentAggregate.offers.map(({ romeCode }) => ({
        rome: romeCode,
        siret: establishmentAggregate.establishment.siret,
        location: establishmentAggregate.establishment.locations[0].position,
      })),
    };
    await this.passEmploiGateway.notifyOnNewImmersionOfferCreatedFromForm(
      notificationParams,
    );
  }
}
