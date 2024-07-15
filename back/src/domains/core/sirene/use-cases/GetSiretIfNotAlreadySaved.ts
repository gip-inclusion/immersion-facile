import {
  GetSiretRequestDto,
  SiretEstablishmentDto,
  getSiretRequestSchema,
} from "shared";
import { ConflictError } from "../../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../UseCase";
import { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../unit-of-work/ports/UnitOfWorkPerformer";
import { getSiretEstablishmentFromApi } from "../helpers/getSirenEstablishmentFromApi";
import { SiretGateway } from "../ports/SirenGateway";

export class GetSiretIfNotAlreadySaved extends TransactionalUseCase<
  GetSiretRequestDto,
  SiretEstablishmentDto
> {
  protected inputSchema = getSiretRequestSchema;

  readonly #siretGateway: SiretGateway;

  constructor(uowPerformer: UnitOfWorkPerformer, siretGateway: SiretGateway) {
    super(uowPerformer);

    this.#siretGateway = siretGateway;
  }

  public async _execute(
    params: GetSiretRequestDto,
    uow: UnitOfWork,
  ): Promise<SiretEstablishmentDto> {
    const { siret } = params;
    const isEstablishmentWithProvidedSiretAlreadyInDb =
      await uow.establishmentAggregateRepository.hasEstablishmentAggregateWithSiret(
        siret,
      );

    if (isEstablishmentWithProvidedSiretAlreadyInDb) {
      throw new ConflictError(
        `Establishment with siret ${siret} already in db`,
      );
    }

    return getSiretEstablishmentFromApi(params, this.#siretGateway);
  }
}
