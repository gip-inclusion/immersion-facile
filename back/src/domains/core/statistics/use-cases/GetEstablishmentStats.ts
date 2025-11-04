import {
  type ApiConsumer,
  type DataWithPagination,
  type DateString,
  errors,
  type PaginationQueryParams,
  paginationRequiredQueryParamsSchema,
} from "shared";
import { useCaseBuilder } from "../../useCaseBuilder";

export type EstablishmentStat = {
  siret: string;
  name: string;
  numberOfConventions: number;
  isReferenced: boolean;
  referencedAt: DateString | null;
};

export type GetEstablishmentStats = ReturnType<
  typeof makeGetEstablishmentStats
>;
export const makeGetEstablishmentStats = useCaseBuilder("GetEstablishmentStats")
  .withInput<Required<PaginationQueryParams>>(
    paginationRequiredQueryParamsSchema,
  )
  .withOutput<DataWithPagination<EstablishmentStat>>()
  .withCurrentUser<ApiConsumer>()
  .build(
    async ({
      inputParams: paginationParams,
      uow,
      currentUser: apiConsumer,
    }) => {
      if (!apiConsumer.rights.statistics.kinds.includes("READ"))
        throw errors.apiConsumer.notEnoughPrivilege();
      return uow.statisticQueries.getEstablishmentStats(paginationParams);
    },
  );
