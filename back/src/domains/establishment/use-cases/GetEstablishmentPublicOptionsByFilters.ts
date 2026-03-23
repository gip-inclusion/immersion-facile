import {
  type ConnectedUser,
  type EstablishmentPublicOption,
  errors,
  getEstablishmentPublicOptionsByFiltersSchema,
  removeSpaces,
} from "shared";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import type { EstablishmentAggregate } from "../entities/EstablishmentAggregate";

export type GetEstablishmentPublicOptionsByFilters = ReturnType<
  typeof makeGetEstablishmentPublicOptionsByFilters
>;
export const makeGetEstablishmentPublicOptionsByFilters = useCaseBuilder(
  "GetEstablishmentPublicOptionsByFilters",
)
  .withInput(getEstablishmentPublicOptionsByFiltersSchema)
  .withOutput<EstablishmentPublicOption[]>()
  .withCurrentUser<ConnectedUser | undefined>()
  .build(async ({ uow, inputParams, currentUser }) => {
    if (!currentUser) throw errors.user.unauthorized();

    const { nameIncludes, siret } = inputParams;

    const establishments =
      await uow.establishmentAggregateRepository.getEstablishmentAggregatesByFilters(
        {
          nameIncludes,
          sirets: siret ? [removeSpaces(siret)] : undefined,
        },
      );

    return establishments.map(toEstablishmentPublicOption);
  });

export const toEstablishmentPublicOption = (
  establishmentAggregate: EstablishmentAggregate,
): EstablishmentPublicOption => ({
  businessName: establishmentAggregate.establishment.name,
  businessNameCustomized: establishmentAggregate.establishment.customizedName,
  siret: establishmentAggregate.establishment.siret,
  userRightIds: establishmentAggregate.userRights.map(({ userId }) => userId),
});
