import {
  type ConnectedUser,
  type EstablishmentPublicOption,
  getEstablishmentPublicOptionsByFiltersSchema,
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
  .withCurrentUser<ConnectedUser>()
  .build(async ({ uow, inputParams }) => {
    const { nameIncludes, siret } = inputParams;

    const establishments =
      await uow.establishmentAggregateRepository.getEstablishmentAggregatesByFilters(
        {
          nameIncludes,
          sirets: siret ? [siret] : undefined,
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
});
