import { pipeWithValue } from "shared/src/pipeWithValue";
import {
  GetSiretRequestDto,
  getSiretRequestSchema,
  GetSiretResponseDto,
} from "shared/src/siret";
import { ConflictError } from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { SireneGateway } from "../ports/SireneGateway";
import {
  convertSireneEtablissementToResponse,
  SireneEstablishmentVO,
} from "../valueObjects/SireneEstablishmentVO";

export class GetSiretIfNotAlreadySaved extends TransactionalUseCase<
  GetSiretRequestDto,
  GetSiretResponseDto
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly sireneGateway: SireneGateway,
  ) {
    super(uowPerformer);
  }

  inputSchema = getSiretRequestSchema;

  public async _execute(
    { siret, includeClosedEstablishments = false }: GetSiretRequestDto,
    uow: UnitOfWork,
  ): Promise<GetSiretResponseDto> {
    const isEstablishmentWithProvidedSiretAlreadyInDb =
      await uow.establishmentAggregateRepo.hasEstablishmentFromFormWithSiret(
        siret,
      );

    if (isEstablishmentWithProvidedSiretAlreadyInDb) {
      throw new ConflictError(
        `Establishment with siret ${siret} already in db`,
      );
    }

    return pipeWithValue(
      await SireneEstablishmentVO.getFromApi(
        { siret, includeClosedEstablishments },
        (...args) => this.sireneGateway.get(...args),
      ),
      convertSireneEtablissementToResponse,
    );
  }
}
