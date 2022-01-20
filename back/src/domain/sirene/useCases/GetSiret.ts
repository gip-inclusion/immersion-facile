import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  GetSiretRequestDto,
  getSiretRequestSchema,
  GetSiretResponseDto,
} from "../../../shared/siret";
import { UseCase } from "../../core/UseCase";
import {
  SireneEstablishmentVO,
  SireneRepository,
} from "../ports/SireneRepository";

export type GetSiretUseCase = UseCase<GetSiretRequestDto, GetSiretResponseDto>;

export class GetSiret extends UseCase<GetSiretRequestDto, GetSiretResponseDto> {
  constructor(private readonly sireneRepository: SireneRepository) {
    super();
  }

  inputSchema = getSiretRequestSchema;

  public async _execute({
    siret,
    includeClosedEstablishments = false,
  }: GetSiretRequestDto): Promise<GetSiretResponseDto> {
    const response = await this.sireneRepository.get(
      siret,
      includeClosedEstablishments,
    );
    if (!response || response.etablissements.length < 1) {
      throw new NotFoundError(siret);
    }
    return convertEtablissementToResponse(response.etablissements[0]);
  }
}

export const convertEtablissementToResponse = async (
  sireneEstablishment: SireneEstablishmentVO,
): Promise<GetSiretResponseDto> => ({
  siret: sireneEstablishment.siret,
  businessName: sireneEstablishment.businessName,
  businessAddress: sireneEstablishment.formatedAddress,
  naf: sireneEstablishment.nafAndNomenclature,
  isOpen: sireneEstablishment.isActive,
});
