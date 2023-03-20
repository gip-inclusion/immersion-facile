import {
  EstablishmentFromSirenApiDto,
  GetSiretRequestDto,
  getSiretRequestSchema,
} from "shared";
import { UseCase } from "../../core/UseCase";
import { SirenGateway } from "../ports/SirenGateway";
import { getSirenEstablishmentFromApi } from "../service/getSirenEstablishmentFromApi";

export class GetSiret extends UseCase<
  GetSiretRequestDto,
  EstablishmentFromSirenApiDto
> {
  constructor(private readonly sirenGateway: SirenGateway) {
    super();
  }

  inputSchema = getSiretRequestSchema;

  public async _execute(
    params: GetSiretRequestDto,
  ): Promise<EstablishmentFromSirenApiDto> {
    return getSirenEstablishmentFromApi(params, this.sirenGateway);
  }
}
