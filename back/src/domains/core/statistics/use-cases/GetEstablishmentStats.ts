import {
  ApiConsumer,
  DataWithPagination,
  PaginationQueryParams,
  errors,
  paginationRequiredQueryParamsSchema,
} from "shared";
import { createTransactionalUseCase } from "../../UseCase";

export type EstablishmentStat = {
  siret: string;
  name: string;
  numberOfConventions: number;
  isReferenced: boolean;
};

export type GetEstablishmentStats = ReturnType<
  typeof makeGetEstablishmentStats
>;
export const makeGetEstablishmentStats = createTransactionalUseCase<
  Required<PaginationQueryParams>,
  DataWithPagination<EstablishmentStat>,
  ApiConsumer
>(
  {
    name: "GetEstablishmentStats",
    inputSchema: paginationRequiredQueryParamsSchema,
  },
  async (paginationParams, { uow }, apiConsumer) => {
    if (!apiConsumer.rights.statistics.kinds.includes("READ"))
      throw errors.apiConsumer.notEnoughPrivilege();
    return uow.statisticQueries.getEstablishmentStats(paginationParams);
  },
);
