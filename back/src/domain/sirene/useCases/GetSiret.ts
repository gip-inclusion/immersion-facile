import {
  GetSiretRequestDto,
  getSiretRequestSchema,
  SiretEstablishmentDto,
} from "shared";
import { UseCase } from "../../core/UseCase";
import { SiretGateway } from "../ports/SirenGateway";
import { getSiretEstablishmentFromApi } from "../service/getSirenEstablishmentFromApi";

export class GetSiret extends UseCase<
  GetSiretRequestDto,
  SiretEstablishmentDto
> {
  inputSchema = getSiretRequestSchema;

  constructor(private readonly siretGateway: SiretGateway) {
    super();
  }

  public async _execute(
    params: GetSiretRequestDto,
  ): Promise<SiretEstablishmentDto> {
    return getSiretEstablishmentFromApi(params, this.siretGateway);
  }
}
