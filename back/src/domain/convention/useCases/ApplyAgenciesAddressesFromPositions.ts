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
    const agenciesupdated: AgencyDto[] = [];
    for (const agency of await this.retrieveAgenciesWithoutAddresses(uow))
      agenciesupdated.push(await this.updateAgencyAddress(agency));
    await this.updateAgencies(agenciesupdated, uow);
  }

  private async updateAgencies(
    agenciesupdated: AgencyDto[],
    uow: UnitOfWork,
  ): Promise<void> {
    await Promise.all(
      agenciesupdated.map((agency) => uow.agencyRepository.update(agency)),
    );
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
    return {
      ...agency,
      address:
        (await this.addressApi.getAddressFromPosition(agency.position)) ||
        unknownAddress,
    };
  }
}

const isWithoutAddress = (address: AddressDto) =>
  isAddressIdentical(address, unknownAddress) ||
  isAddressIdentical(address, noAddress);
