import {
  ApiConsumer,
  DataWithPagination,
  PaginationQueryParams,
  paginationRequiredQueryParamsSchema,
} from "shared";
import { ForbiddenError } from "shared";
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
      throw new ForbiddenError(
        "You don't have sufficient rights to access this route. Contact support if you want more privileges.",
      );
    return uow.statisticQueries.getEstablishmentStats(paginationParams);
  },
);
