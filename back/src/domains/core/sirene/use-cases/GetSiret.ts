import {
  GetSiretRequestDto,
  SiretEstablishmentDto,
  getSiretRequestSchema,
} from "shared";
import { UseCase } from "../../UseCase";
import { getSiretEstablishmentFromApi } from "../helpers/getSirenEstablishmentFromApi";
import { SiretGateway } from "../ports/SirenGateway";

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
