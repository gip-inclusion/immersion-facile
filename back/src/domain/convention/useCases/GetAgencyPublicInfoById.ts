import {
  AgencyPublicDisplayDto,
  toAgencyPublicDisplayDto,
  WithAgencyId,
  withAgencyIdSchema,
} from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class GetAgencyPublicInfoById extends TransactionalUseCase<
  WithAgencyId,
  AgencyPublicDisplayDto
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = withAgencyIdSchema;

  public async _execute(
    { id }: WithAgencyId,
    uow: UnitOfWork,
  ): Promise<AgencyPublicDisplayDto> {
    const agencyEntity = await uow.agencyRepository.getById(id);
    if (!agencyEntity) throw new NotFoundError(id);
    return toAgencyPublicDisplayDto(agencyEntity);
  }
}
