import { type WithSiretDto, errors, withSiretSchema } from "shared";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";
import type {
  PassEmploiGateway,
  PassEmploiNotificationParams,
} from "../../ports/PassEmploiGateway";

export class NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm extends TransactionalUseCase<WithSiretDto> {
  protected inputSchema = withSiretSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private passEmploiGateway: PassEmploiGateway,
  ) {
    super(uowPerformer);
  }

  public async _execute(
    { siret }: WithSiretDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const establishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        siret,
      );
    if (!establishmentAggregate) throw errors.establishment.notFound({ siret });
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
