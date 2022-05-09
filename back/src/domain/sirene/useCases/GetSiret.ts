import {
  GetSiretRequestDto,
  getSiretRequestSchema,
  GetSiretResponseDto,
} from "shared/src/siret";
import { UseCase } from "../../core/UseCase";
import { SireneGateway } from "../ports/SireneGateway";
import { SireneEstablishmentVO } from "../valueObjects/SireneEstablishmentVO";
import { pipeWithValue } from "shared/src/pipeWithValue";

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
      convertEtablissementToResponse,
    );
  }
}

export const convertEtablissementToResponse = (
  sireneEstablishment: SireneEstablishmentVO,
): GetSiretResponseDto => ({
  siret: sireneEstablishment.siret,
  businessName: sireneEstablishment.businessName,
  businessAddress: sireneEstablishment.formatedAddress,
  naf: sireneEstablishment.nafAndNomenclature,
  isOpen: sireneEstablishment.isActive,
});
