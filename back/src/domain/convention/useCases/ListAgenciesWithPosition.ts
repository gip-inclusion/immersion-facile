import {
  AgencyDto,
  AgencyWithPositionDto,
  AgencyKindFilter,
  ListAgenciesWithPositionRequestDto,
} from "shared/src/agency/agency.dto";
import { listAgenciesRequestSchema } from "shared/src/agency/agency.schema";
import { LatLonDto } from "shared/src/latLon";
import { UseCase } from "../../core/UseCase";
import { AgencyRepository } from "../ports/AgencyRepository";

export class ListAgenciesWithPosition extends UseCase<
  ListAgenciesWithPositionRequestDto,
  AgencyWithPositionDto[]
> {
  constructor(readonly agencyRepository: AgencyRepository) {
    super();
  }

  inputSchema = listAgenciesRequestSchema;

  public async _execute({
    lon,
    lat,
    filter,
  }: ListAgenciesWithPositionRequestDto): Promise<AgencyWithPositionDto[]> {
    const agencies = await this.getAgencies(
      lon && lat ? { lon, lat } : undefined,
      filter,
    );
    return agencies.map(agencyToAgencyWithPositionDto);
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

const agencyToAgencyWithPositionDto = (
  config: AgencyDto,
): AgencyWithPositionDto => ({
  id: config.id,
  name: config.name,
  position: {
    lat: config.position.lat,
    lon: config.position.lon,
  },
});
