import {
  AgencyDto,
  PrivateListAgenciesRequestDto,
  privateListAgenciesRequestSchema,
} from "shared";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class PrivateListAgencies extends TransactionalUseCase<
  PrivateListAgenciesRequestDto,
  AgencyDto[]
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = privateListAgenciesRequestSchema;

  public async _execute(
    { status }: PrivateListAgenciesRequestDto,
    uow: UnitOfWork,
  ): Promise<AgencyDto[]> {
    const agencies = await uow.agencyRepository.getAgencies({
      filters: { status: status && [status] },
    });
    return agencies;
  }
}
