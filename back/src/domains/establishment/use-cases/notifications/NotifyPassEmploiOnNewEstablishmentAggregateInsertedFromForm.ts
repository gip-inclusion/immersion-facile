import { errors, type WithSiretDto, withSiretSchema } from "shared";
import { useCaseBuilder } from "../../../core/useCaseBuilder";
import type {
  PassEmploiGateway,
  PassEmploiNotificationParams,
} from "../../ports/PassEmploiGateway";

export type NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm =
  ReturnType<
    typeof makeNotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm
  >;

type Deps = {
  passEmploiGateway: PassEmploiGateway;
};

export const makeNotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm =
  useCaseBuilder("NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm")
    .withInput<WithSiretDto>(withSiretSchema)
    .withDeps<Deps>()
    .build(async ({ deps, inputParams, uow }) => {
      const establishmentAggregate =
        await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
          inputParams.siret,
        );
      if (!establishmentAggregate)
        throw errors.establishment.notFound({ siret: inputParams.siret });
      const notificationParams: PassEmploiNotificationParams = {
        immersions: establishmentAggregate.offers.map(({ romeCode }) => ({
          rome: romeCode,
          siret: establishmentAggregate.establishment.siret,
          location: establishmentAggregate.establishment.locations[0].position,
        })),
      };
      await deps.passEmploiGateway.notifyOnNewImmersionOfferCreatedFromForm(
        notificationParams,
      );
    });
