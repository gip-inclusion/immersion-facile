import {
  AgencyDto,
  AgencyInListDto,
  AgencyKindFilter,
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
    lon,
    lat,
    filter,
  }: ListAgenciesRequestDto): Promise<AgencyInListDto[]> {
    const agencies = await this.getAgencies(
      lon && lat ? { lon, lat } : undefined,
      filter,
    );
    return agencies.map(agencyToAgencyInListDto);
  }

  private getAgencies(
    position?: LatLonDto,
    agencyKindFilter?: AgencyKindFilter,
  ): Promise<AgencyDto[]> {
    if (position)
      return this.agencyRepository.getAllActiveNearby(
        position,
        100,
        agencyKindFilter,
      );
    return this.agencyRepository.getAllActive(agencyKindFilter);
  }
}

const agencyToAgencyInListDto = (config: AgencyDto): AgencyInListDto => ({
  id: config.id,
  name: config.name,
  position: {
    lat: config.position.lat,
    lon: config.position.lon,
  },
});
