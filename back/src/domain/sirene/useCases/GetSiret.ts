import {
  GetSiretRequestDto,
  getSiretRequestSchema,
  GetSiretResponseDto,
  pipeWithValue,
} from "shared";
import { UseCase } from "../../core/UseCase";
import { SirenGateway } from "../ports/SirenGateway";
import {
  convertSirenEtablissementToResponse,
  SirenEstablishmentVO,
} from "../valueObjects/SirenEstablishmentVO";

export type GetSiretUseCase = UseCase<GetSiretRequestDto, GetSiretResponseDto>;

export class GetSiret extends UseCase<GetSiretRequestDto, GetSiretResponseDto> {
  constructor(private readonly sirenGateway: SirenGateway) {
    super();
  }

  inputSchema = getSiretRequestSchema;

  public async _execute({
    siret,
    includeClosedEstablishments = false,
  }: GetSiretRequestDto): Promise<GetSiretResponseDto> {
    return pipeWithValue(
      await SirenEstablishmentVO.getFromApi(
        { siret, includeClosedEstablishments },
        (...args) => this.sirenGateway.getEstablishmentBySiret(...args),
      ),
      convertSirenEtablissementToResponse,
    );
  }
}
