import { z } from "zod";
import {
  ApiConsumer,
  RomeCode,
  romeCodeSchema,
  SearchResultDto,
  SiretDto,
  siretSchema,
} from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

const getSearchResultBySiretAndRomeSchema: z.Schema<GetSearchResultBySiretAndRomePayload> =
  z.object({
    siret: siretSchema,
    rome: romeCodeSchema,
  });

export type GetSearchResultBySiretAndRomePayload = {
  siret: SiretDto;
  rome: RomeCode;
};

export class GetSearchResultBySiretAndRome extends TransactionalUseCase<
  GetSearchResultBySiretAndRomePayload,
  SearchResultDto,
  ApiConsumer
> {
  protected inputSchema = getSearchResultBySiretAndRomeSchema;

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  public async _execute(
    { rome, siret }: GetSearchResultBySiretAndRomePayload,
    uow: UnitOfWork,
    _apiConsumer?: ApiConsumer,
  ): Promise<SearchResultDto> {
    const searchImmersionResultDto =
      await uow.establishmentAggregateRepository.getSearchImmersionResultDtoBySiretAndRome(
        siret,
        rome,
      );
    if (!searchImmersionResultDto)
      throw new NotFoundError(
        `No offer found for siret ${siret} and rome ${rome}`,
      );

    return searchImmersionResultDto;
  }
}
