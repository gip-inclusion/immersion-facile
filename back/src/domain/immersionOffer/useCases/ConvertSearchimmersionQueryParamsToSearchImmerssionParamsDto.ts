import {
  SearchImmersionParamsDto,
  SearchImmersionQueryParamsDto,
  searchImmersionQueryParamsSchema,
} from "shared";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class ConvertSearchimmersionQueryParamsToSearchImmerssionParamsDto extends TransactionalUseCase<
  SearchImmersionQueryParamsDto,
  SearchImmersionParamsDto
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = searchImmersionQueryParamsSchema;

  protected async _execute(
    queryParams: SearchImmersionQueryParamsDto,
    uow: UnitOfWork,
  ): Promise<SearchImmersionParamsDto> {
    const appelationAndRome = queryParams.appellationCode
      ? await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodes([
          queryParams.appellationCode,
        ])
      : undefined;

    const rome = appelationAndRome ? appelationAndRome[0].romeCode : undefined;

    if (!rome) return queryParams;

    return { ...queryParams, rome };
  }
}
