import {
  GetSiretRequestDto,
  getSiretRequestSchema,
  SiretEstablishmentDto,
} from "shared";
import { UseCase } from "../../core/UseCase";
import { SiretGateway } from "../ports/SirenGateway";
import { getSirenEstablishmentFromApi } from "../service/getSirenEstablishmentFromApi";

export class GetSiret extends UseCase<
  GetSiretRequestDto,
  SiretEstablishmentDto
> {
  constructor(private readonly sirenGateway: SiretGateway) {
    super();
  }

  inputSchema = getSiretRequestSchema;

  public async _execute(
    params: GetSiretRequestDto,
  ): Promise<SiretEstablishmentDto> {
    return getSirenEstablishmentFromApi(params, this.sirenGateway);
  }
}
