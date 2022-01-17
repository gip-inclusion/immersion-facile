import {
  AgencyDto,
  ListAgenciesRequestDto,
  listAgenciesRequestSchema,
  ListAgenciesResponseDto,
} from "../../../shared/agencies";
import { LatLonDto } from "../../../shared/SearchImmersionDto";
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

  public async _execute({
    position,
  }: ListAgenciesRequestDto): Promise<AgencyDto[]> {
    const agencyConfigs = await this.getAgenciesConfig(position);
    return agencyConfigs.map(agencyConfigToAgencyDto);
  }

  private getAgenciesConfig(position?: LatLonDto): Promise<AgencyConfig[]> {
    if (position) return this.agencyRepository.getNearby(position);
    return this.agencyRepository.getAll();
  }
}

const agencyConfigToAgencyDto = (config: AgencyConfig): AgencyDto => ({
  id: config.id,
  name: config.name,
  position: {
    lat: config.position.lat,
    lon: config.position.lon,
  },
});
