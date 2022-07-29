import { AddressDto } from "shared/src/address/address.dto";
import { AgencyDtoBuilder } from "shared/src/agency/AgencyDtoBuilder";
import { LatLonDto } from "shared/src/latLon";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryAddressAPI } from "../../../adapters/secondary/immersionOffer/InMemoryAddressAPI";
import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import {
  ApplyAgenciesAddressesFromPositions,
  noAddress,
  unknownAddress,
} from "../../../domain/convention/useCases/ApplyAgenciesAddressesFromPositions";
import { expectTypeToMatchAndEqual } from "../../../_testBuilders/test.helpers";

const position: LatLonDto = {
  lat: 0.722573,
  lon: 45.1851381,
};

const address: AddressDto = {
  city: "Périgueux",
  departmentCode: "24",
  postcode: "24000",
  streetNumberAndAddress: "17 Rue Saint-Front",
};

const agencyWithoutAddress = new AgencyDtoBuilder()
  .withId("1")
  .withPosition(position.lat, position.lon)
  .build();
const agencyWithAddress = new AgencyDtoBuilder()
  .withId("1")
  .withPosition(position.lat, position.lon)
  .withAddress(address)
  .build();
const agencyWithEmptyAddress = new AgencyDtoBuilder()
  .withId("1")
  .withPosition(position.lat, position.lon)
  .withAddress(noAddress)
  .build();
const agencyWithUnknownAddress = new AgencyDtoBuilder()
  .withId("1")
  .withPosition(position.lat, position.lon)
  .withAddress(unknownAddress)
  .build();

describe("Apply agencies address DTOs from positions", () => {
  let agencyRepository: InMemoryAgencyRepository;
  let httpAddressApi: InMemoryAddressAPI;
  let useCase: ApplyAgenciesAddressesFromPositions;

  beforeEach(() => {
    const uow = createInMemoryUow();
    agencyRepository = uow.agencyRepository;
    httpAddressApi = new InMemoryAddressAPI();
    useCase = new ApplyAgenciesAddressesFromPositions(
      new InMemoryUowPerformer(uow),
      httpAddressApi,
    );
  });

  it("Apply address on agency without address", async () => {
    agencyRepository.setAgencies([agencyWithoutAddress]);
    httpAddressApi.setNextAddress(address);
    await useCase.execute();
    expectTypeToMatchAndEqual(agencyRepository.agencies, [agencyWithAddress]);
  });
  it("Apply address on agency with empty address", async () => {
    agencyRepository.setAgencies([agencyWithEmptyAddress]);
    httpAddressApi.setNextAddress(address);
    await useCase.execute();
    expectTypeToMatchAndEqual(agencyRepository.agencies, [agencyWithAddress]);
  });
  it("Apply unknown address on no address available on adresse api", async () => {
    agencyRepository.setAgencies([agencyWithoutAddress]);
    await useCase.execute();
    expectTypeToMatchAndEqual(agencyRepository.agencies, [
      agencyWithUnknownAddress,
    ]);
  });
  it("Don't apply address when agency already have it", async () => {
    agencyRepository.setAgencies([agencyWithAddress]);
    await useCase.execute();
    expectTypeToMatchAndEqual(agencyRepository.agencies, [agencyWithAddress]);
  });
});
