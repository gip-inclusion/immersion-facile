import { pipeWithValue } from "shared";
import {
  GetSiretRequestDto,
  getSiretRequestSchema,
  GetSiretResponseDto,
} from "shared";
import { UseCase } from "../../core/UseCase";
import { SireneGateway } from "../ports/SireneGateway";
import {
  convertSireneEtablissementToResponse,
  SireneEstablishmentVO,
} from "../valueObjects/SireneEstablishmentVO";

export type GetSiretUseCase = UseCase<GetSiretRequestDto, GetSiretResponseDto>;

export class GetSiret extends UseCase<GetSiretRequestDto, GetSiretResponseDto> {
  constructor(private readonly sireneGateway: SireneGateway) {
    super();
  }

  inputSchema = getSiretRequestSchema;

  public async _execute({
    siret,
    includeClosedEstablishments = false,
  }: GetSiretRequestDto): Promise<GetSiretResponseDto> {
    return pipeWithValue(
      await SireneEstablishmentVO.getFromApi(
        { siret, includeClosedEstablishments },
        (...args) => this.sireneGateway.get(...args),
      ),
      convertSireneEtablissementToResponse,
    );
  }
}
