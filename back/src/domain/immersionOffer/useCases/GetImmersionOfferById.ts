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

const legacyImmersionOfferIdSchema: z.Schema<GetImmersionOfferByIdPayload> =
  z.object({
    siret: siretSchema,
    rome: romeCodeSchema,
  });

export type GetImmersionOfferByIdPayload = {
  siret: SiretDto;
  rome: RomeCode;
};

export class GetImmersionOfferById extends TransactionalUseCase<
  GetImmersionOfferByIdPayload,
  SearchImmersionResultDto,
  ApiConsumer
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = legacyImmersionOfferIdSchema;

  public async _execute(
    { rome, siret }: GetImmersionOfferByIdPayload,
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
