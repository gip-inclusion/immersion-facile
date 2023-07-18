import {
  SearchImmersionParamsDto,
  SearchImmersionQueryParamsDto,
  searchImmersionQueryParamsSchema,
} from "shared";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class ConvertSearchImmersionQueryParamsToSearchImmerssionParamsDto extends TransactionalUseCase<
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
    const appellationAndRome = queryParams.appellationCode
      ? await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodes([
          queryParams.appellationCode,
        ])
      : [];

    const rome = appellationAndRome.at(0)?.romeCode;

    if (!rome) return queryParams;

    return { ...queryParams, rome };
  }
}
