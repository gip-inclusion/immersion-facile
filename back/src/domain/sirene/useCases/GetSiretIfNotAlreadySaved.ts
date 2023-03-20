import {
  GetSiretRequestDto,
  getSiretRequestSchema,
  GetSiretResponseDto,
  pipeWithValue,
} from "shared";
import { ConflictError } from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { SirenGateway } from "../ports/SirenGateway";
import {
  convertSirenEtablissementToResponse,
  SirenEstablishmentVO,
} from "../valueObjects/SirenEstablishmentVO";

export class GetSiretIfNotAlreadySaved extends TransactionalUseCase<
  GetSiretRequestDto,
  GetSiretResponseDto
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly sirenGateway: SirenGateway,
  ) {
    super(uowPerformer);
  }

  inputSchema = getSiretRequestSchema;

  public async _execute(
    { siret, includeClosedEstablishments = false }: GetSiretRequestDto,
    uow: UnitOfWork,
  ): Promise<GetSiretResponseDto> {
    const isEstablishmentWithProvidedSiretAlreadyInDb =
      await uow.establishmentAggregateRepository.hasEstablishmentFromFormWithSiret(
        siret,
      );

    if (isEstablishmentWithProvidedSiretAlreadyInDb) {
      throw new ConflictError(
        `Establishment with siret ${siret} already in db`,
      );
    }

    return pipeWithValue(
      await SirenEstablishmentVO.getFromApi(
        { siret, includeClosedEstablishments },
        (...args) => this.sirenGateway.getEstablishmentBySiret(...args),
      ),
      convertSirenEtablissementToResponse,
    );
  }
}
