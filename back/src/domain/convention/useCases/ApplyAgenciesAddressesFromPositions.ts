import { AddressDto, isAddressIdentical } from "shared/src/address/address.dto";
import { AgencyDto } from "shared/src/agency/agency.dto";
import { ConventionId } from "shared/src/convention/convention.dto";
import { z } from "zod";
import { createLogger } from "../../../utils/logger";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { AddressAPI } from "../../immersionOffer/ports/AddressAPI";

const logger = createLogger(__filename);

export type ImmersionAssessmentEmailParams = {
  immersionId: ConventionId;
  mentorName: string;
  mentorEmail: string;
  beneficiaryFirstName: string;
  beneficiaryLastName: string;
};

export const unknownAddress: AddressDto = {
  city: "Inconnu",
  departmentCode: "Inconnu",
  postcode: "Inconnu",
  streetNumberAndAddress: "Inconnu",
};
export const noAddress: AddressDto = {
  city: "",
  departmentCode: "",
  postcode: "",
  streetNumberAndAddress: "",
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
    const agenciesWithoutAddresses =
      await this.retrieveAgenciesWithoutAddresses(uow);
    const agenciesupdated = await Promise.all(
      agenciesWithoutAddresses.map(this.updateAgencyAddress),
    );
    await Promise.all(agenciesupdated.map(uow.agencyRepository.update));
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
