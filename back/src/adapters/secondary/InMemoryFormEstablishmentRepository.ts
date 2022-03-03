import { FormEstablishmentDto } from "../../shared/FormEstablishmentDto";
import { FormEstablishmentRepository } from "../../domain/immersionOffer/ports/FormEstablishmentRepository";
import { propEq } from "../../shared/ramdaExtensions/propEq";
import { SiretDto } from "../../shared/siret";
import { createLogger } from "../../utils/logger";
import { ConflictError } from "../primary/helpers/httpErrors";

const logger = createLogger(__filename);

export class InMemoryFormEstablishmentRepository
  implements FormEstablishmentRepository
{
  private formEstablishments: FormEstablishmentDto[] = [];

  public async create(dto: FormEstablishmentDto): Promise<void> {
    if (await this.getBySiret(dto.siret)) {
      const message = `Immersion DTO with siret ${dto.siret} is already in the list`;
      logger.info({ dto: dto }, message);
      throw new ConflictError(message);
    }
    logger.debug({ immersionOffer: dto }, "Creating a new Immersion Offer");
    this.formEstablishments.push(dto);
  }
  public async edit(dto: FormEstablishmentDto): Promise<void> {
    if (!(await this.getBySiret(dto.siret))) {
      const message = `Cannot update form establishlment DTO with siret ${dto.siret}, since it is not in list.`;
      logger.info({ dto: dto }, message);
      throw new ConflictError(message);
    }
    this.formEstablishments = this.formEstablishments.map((repoDto) =>
      repoDto.siret === dto.siret ? dto : repoDto,
    );
  }

  public async getAll() {
    return this.formEstablishments;
  }

  public async getBySiret(
    siretToGet: SiretDto,
  ): Promise<FormEstablishmentDto | undefined> {
    return this.formEstablishments.find(propEq("siret", siretToGet));
  }
}
