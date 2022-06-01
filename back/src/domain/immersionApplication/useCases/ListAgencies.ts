import {
  Agency,
  AgencyInListDto,
  ListAgenciesRequestDto,
} from "shared/src/agency/agency.dto";
import { listAgenciesRequestSchema } from "shared/src/agency/agency.schema";
import { LatLonDto } from "shared/src/latLon";
import { UseCase } from "../../core/UseCase";
import { AgencyRepository } from "../ports/AgencyRepository";

export class ListAgencies extends UseCase<
  ListAgenciesRequestDto,
  AgencyInListDto[]
> {
  constructor(readonly agencyRepository: AgencyRepository) {
    super();
  }

  inputSchema = listAgenciesRequestSchema;

  public async _execute({
    position,
  }: ListAgenciesRequestDto): Promise<AgencyInListDto[]> {
    const agencies = await this.getAgencies(position);
    return agencies.map(agencyToAgencyInListDto);
  }

  private getAgencies(position?: LatLonDto): Promise<Agency[]> {
    if (position) return this.agencyRepository.getNearby(position, 100);
    return this.agencyRepository.getAllActive();
  }
}

const agencyToAgencyInListDto = (config: Agency): AgencyInListDto => ({
  id: config.id,
  name: config.name,
  position: {
    lat: config.position.lat,
    lon: config.position.lon,
  },
});
