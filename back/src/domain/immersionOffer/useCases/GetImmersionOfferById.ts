import {
  ApiConsumer,
  RomeCode,
  SearchImmersionResultDto,
  SiretDto,
  zString,
} from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

type LegacyImmersionOfferId = `${SiretDto}-${RomeCode}`;
export class GetImmersionOfferById extends TransactionalUseCase<
  string,
  SearchImmersionResultDto,
  ApiConsumer
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = zString;

  public async _execute(
    immersionOfferId: LegacyImmersionOfferId,
    uow: UnitOfWork,
    _apiConsumer?: ApiConsumer,
  ): Promise<SearchImmersionResultDto> {
    const [siret, romeCode] = immersionOfferId.split("-");
    const searchImmersionResultDto =
      await uow.establishmentAggregateRepository.getSearchImmersionResultDtoBySiretAndRome(
        siret,
        romeCode,
      );
    if (!searchImmersionResultDto)
      throw new NotFoundError(
        `No offer found for siret ${siret} and rome ${romeCode}`,
      );

    return searchImmersionResultDto;
  }
}
