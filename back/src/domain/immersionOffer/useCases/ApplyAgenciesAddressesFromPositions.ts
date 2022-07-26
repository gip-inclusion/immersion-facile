import {
  isAddressIdentical,
  noAddress,
  unknownAddress,
} from "shared/src/address/address.dto";
import { AgencyDto } from "shared/src/agency/agency.dto";
import { ConventionId } from "shared/src/convention/convention.dto";
import { z } from "zod";
import { createLogger } from "../../../utils/logger";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { AddressAPI } from "../ports/AddressAPI";

const logger = createLogger(__filename);

export type ImmersionAssessmentEmailParams = {
  immersionId: ConventionId;
  mentorName: string;
  mentorEmail: string;
  beneficiaryFirstName: string;
  beneficiaryLastName: string;
};

export class ApplyAgenciesAddressesFromPositions extends TransactionalUseCase<void> {
  inputSchema = z.void();

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private addressApi: AddressAPI,
  ) {
    super(uowPerformer);
  }

  protected async _execute(_: void, uow: UnitOfWork): Promise<void> {
    // eslint-disable-next-line no-console

    const agenciesWithoutAddresses =
      await this.retrieveAgenciesWithoutAddresses(uow);

    const agenciesupdated = await Promise.all(
      agenciesWithoutAddresses.map((agency) =>
        this.updateAgencyAddress(agency),
      ),
    );
    await Promise.all(
      agenciesupdated.map((agency) => uow.agencyRepository.update(agency)),
    );
  }

  private async retrieveAgenciesWithoutAddresses(
    uow: UnitOfWork,
  ): Promise<AgencyDto[]> {
    const agencies = await uow.agencyRepository.getAgencies({});

    const agenciesWithoutAddresses = agencies.filter(
      (agency) =>
        isAddressIdentical(agency.address, unknownAddress) ||
        isAddressIdentical(agency.address, noAddress),
    );
    logger.info(`${agencies.length} agencies without addresses retrieved.`);
    return agenciesWithoutAddresses;
  }

  private async updateAgencyAddress(agency: AgencyDto): Promise<AgencyDto> {
    const address = await this.addressApi.getAddressFromPosition(
      agency.position,
    );

    return {
      ...agency,
      address: address || unknownAddress,
    };
  }
}
