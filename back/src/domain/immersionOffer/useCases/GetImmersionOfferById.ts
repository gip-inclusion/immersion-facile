import { z } from "zod";
import {
  ApiConsumer,
  RomeCode,
  romeCodeSchema,
  SearchImmersionResultDto,
  SiretDto,
  siretSchema,
} from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

const getSearchImmersionResultBySiretAndRomeSchema: z.Schema<GetSearchImmersionResultBySiretAndRomePayload> =
  z.object({
    siret: siretSchema,
    rome: romeCodeSchema,
  });

export type GetSearchImmersionResultBySiretAndRomePayload = {
  siret: SiretDto;
  rome: RomeCode;
};

export class GetSearchImmersionResultBySiretAndRome extends TransactionalUseCase<
  GetSearchImmersionResultBySiretAndRomePayload,
  SearchImmersionResultDto,
  ApiConsumer
> {
  inputSchema = getSearchImmersionResultBySiretAndRomeSchema;

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  public async _execute(
    { rome, siret }: GetSearchImmersionResultBySiretAndRomePayload,
    uow: UnitOfWork,
    _apiConsumer?: ApiConsumer,
  ): Promise<SearchImmersionResultDto> {
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
