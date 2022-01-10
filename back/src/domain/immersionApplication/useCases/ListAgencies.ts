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
  }: ListAgenciesRequestDto): Promise<ListAgenciesResponseDto> {
    let configs = null;
    if (position) {
      configs = await this.agencyRepository.getNearby(position);
    } else {
      configs = await this.agencyRepository.getAll();
    }
    return configs.map(agencyConfigToAgencyDto);
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
