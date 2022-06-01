import { z } from "zod";
import { UseCase } from "../../../core/UseCase";
import { EstablishmentAggregate } from "../../entities/EstablishmentEntity";
import {
  PassEmploiGateway,
  PassEmploiNotificationParams,
} from "../../ports/PassEmploiGateway";

export class NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm extends UseCase<
  EstablishmentAggregate,
  void
> {
  inputSchema = z.any(); // No need of a validation schema here since this use-case is only called from the our domain

  constructor(private passEmploiGateway: PassEmploiGateway) {
    super();
  }

  public async _execute(
    establishmentAggregate: EstablishmentAggregate,
  ): Promise<void> {
    const notificationParams: PassEmploiNotificationParams = {
      immersions: establishmentAggregate.immersionOffers.map(
        ({ romeCode }) => ({
          rome: romeCode,
          siret: establishmentAggregate.establishment.siret,
          location: establishmentAggregate.establishment.position,
        }),
      ),
    };
    await this.passEmploiGateway.notifyOnNewImmersionOfferCreatedFromForm(
      notificationParams,
    );
  }
}
