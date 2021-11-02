import {
  AgencyDto,
  ListAgenciesRequestDto,
  listAgenciesRequestSchema,
  ListAgenciesResponseDto,
} from "../../../shared/agencies";
import { UseCase } from "../../core/UseCase";
import { AgencyConfig, AgencyRepository } from "../ports/AgencyRepository";

export class ListAgencies extends UseCase<
  ListAgenciesRequestDto,
  ListAgenciesResponseDto
> {
  constructor(readonly agencyRepository: AgencyRepository) {
    super();
  }

  inputSchema = listAgenciesRequestSchema;

  public async _execute(): Promise<ListAgenciesResponseDto> {
    const configs = await this.agencyRepository.getAll();
    return configs.map(agencyConfigToAgencyDto);
  }
}

const agencyConfigToAgencyDto = (config: AgencyConfig): AgencyDto => ({
  id: config.id,
  name: config.name,
});
