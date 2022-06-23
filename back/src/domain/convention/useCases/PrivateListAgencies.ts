import {
  AgencyDto,
  PrivateListAgenciesRequestDto,
} from "shared/src/agency/agency.dto";
import { privateListAgenciesRequestSchema } from "shared/src/agency/agency.schema";
import { UseCase } from "../../core/UseCase";
import { AgencyRepository } from "../ports/AgencyRepository";

export class PrivateListAgencies extends UseCase<
  PrivateListAgenciesRequestDto,
  AgencyDto[]
> {
  constructor(readonly agencyRepository: AgencyRepository) {
    super();
  }

  inputSchema = privateListAgenciesRequestSchema;

  public async _execute({
    status,
  }: PrivateListAgenciesRequestDto): Promise<AgencyDto[]> {
    const agencies = await this.agencyRepository.getAgencies({
      filters: { status: status && [status] },
    });
    return agencies;
  }
}
