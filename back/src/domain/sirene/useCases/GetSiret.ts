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
  protected inputSchema = getSiretRequestSchema;

  readonly #siretGateway: SiretGateway;

  constructor(siretGateway: SiretGateway) {
    super();
    this.#siretGateway = siretGateway;
  }

  public async _execute(
    params: GetSiretRequestDto,
  ): Promise<SiretEstablishmentDto> {
    return getSiretEstablishmentFromApi(params, this.#siretGateway);
  }
}
