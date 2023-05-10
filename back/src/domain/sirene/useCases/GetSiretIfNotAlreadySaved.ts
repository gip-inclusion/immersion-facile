import {
  GetSiretRequestDto,
  getSiretRequestSchema,
  SirenEstablishmentDto,
} from "shared";
import { ConflictError } from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { SirenGateway } from "../ports/SirenGateway";
import { getSirenEstablishmentFromApi } from "../service/getSirenEstablishmentFromApi";

export class GetSiretIfNotAlreadySaved extends TransactionalUseCase<
  GetSiretRequestDto,
  SirenEstablishmentDto
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly sirenGateway: SirenGateway,
  ) {
    super(uowPerformer);
  }

  inputSchema = getSiretRequestSchema;

  public async _execute(
    params: GetSiretRequestDto,
    uow: UnitOfWork,
  ): Promise<SirenEstablishmentDto> {
    const { siret } = params;
    const isEstablishmentWithProvidedSiretAlreadyInDb =
      await uow.establishmentAggregateRepository.hasEstablishmentWithSiret(
        siret,
      );

    if (isEstablishmentWithProvidedSiretAlreadyInDb) {
      throw new ConflictError(
        `Establishment with siret ${siret} already in db`,
      );
    }

    return getSirenEstablishmentFromApi(params, this.sirenGateway);
  }
}
