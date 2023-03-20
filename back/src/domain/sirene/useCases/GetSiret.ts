import {
  SirenEstablishmentDto,
  GetSiretRequestDto,
  getSiretRequestSchema,
} from "shared";
import { UseCase } from "../../core/UseCase";
import { SirenGateway } from "../ports/SirenGateway";
import { getSirenEstablishmentFromApi } from "../service/getSirenEstablishmentFromApi";

export class GetSiret extends UseCase<
  GetSiretRequestDto,
  SirenEstablishmentDto
> {
  constructor(private readonly sirenGateway: SirenGateway) {
    super();
  }

  inputSchema = getSiretRequestSchema;

  public async _execute(
    params: GetSiretRequestDto,
  ): Promise<SirenEstablishmentDto> {
    return getSirenEstablishmentFromApi(params, this.sirenGateway);
  }
}
