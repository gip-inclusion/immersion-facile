import { AddressDto, isAddressIdentical } from "shared/src/address/address.dto";
import { AgencyDto } from "shared/src/agency/agency.dto";
import { unknownAddress } from "shared/src/apiAdresse/apiAddress.dto";
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
    for (const agency of await this.retrieveAgenciesWithoutAddresses(uow))
      await uow.agencyRepository.update(await this.updateAgencyAddress(agency));
  }

  private async retrieveAgenciesWithoutAddresses(
    uow: UnitOfWork,
  ): Promise<AgencyDto[]> {
    const allAgencies = await uow.agencyRepository.getAgencies({});
    const agenciesWithoutAddresses = allAgencies.filter((agency) =>
      isWithoutAddress(agency.address),
    );
    logger.info(
      `${agenciesWithoutAddresses.length} agencies without addresses retrieved.`,
    );
    return agenciesWithoutAddresses;
  }

  private async updateAgencyAddress(agency: AgencyDto): Promise<AgencyDto> {
    try {
      const address = await this.addressApi.getAddressFromPosition(
        agency.position,
      );
      if (!address)
        logger.warn(
          `No address found for agency [${agency.id} - ${
            agency.name
          }] at position ${JSON.stringify(agency.position)}`,
        );
      return {
        ...agency,
        address: address || unknownAddress,
      };
    } catch (error) {
      logger.error({ error, agency }, "updateAgencyAddress");
      return {
        ...agency,
        address: unknownAddress,
      };
    }
  }
}

const isWithoutAddress = (address: AddressDto) =>
  isAddressIdentical(address, unknownAddress) ||
  isAddressIdentical(address, noAddress);
