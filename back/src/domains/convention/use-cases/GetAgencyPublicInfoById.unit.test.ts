import {
  AgencyDtoBuilder,
  type AgencyPublicDisplayDto,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { GetAgencyPublicInfoById } from "./GetAgencyPublicInfoById";

describe("GetAgencyPublicInfoById", () => {
  const agency = new AgencyDtoBuilder().withId("agency1").build();
  const agency2 = new AgencyDtoBuilder()
    .withRefersToAgencyInfo({
      refersToAgencyId: agency.id,
      refersToAgencyName: agency.name,
    })
    .withId("agency2")
    .build();
  let uow: InMemoryUnitOfWork;
  let useCase: GetAgencyPublicInfoById;
  beforeEach(() => {
    uow = createInMemoryUow();
    useCase = new GetAgencyPublicInfoById(new InMemoryUowPerformer(uow));
  });

  describe("Happy path", () => {
    it("Should return agency public info for agency with referred agency", async () => {
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency),
        toAgencyWithRights(agency2),
      ];

      const expectedAgencyPublicDisplay: AgencyPublicDisplayDto = {
        id: agency2.id,
        name: agency2.name,
        kind: agency2.kind,
        signature: agency2.signature,
        position: agency2.position,
        address: agency2.address,
        agencySiret: agency2.agencySiret,
        refersToAgency: {
          id: agency.id,
          name: agency.name,
          kind: agency.kind,
          signature: agency.signature,
          position: agency.position,
          address: agency.address,
          agencySiret: agency.agencySiret,
          logoUrl: agency.logoUrl,
        },
        logoUrl: agency2.logoUrl,
      };

      expectToEqual(
        await useCase.execute({ agencyId: agency2.id }),
        expectedAgencyPublicDisplay,
      );
    });

    it("Should return agency public info for agency without referred agency", async () => {
      uow.agencyRepository.agencies = [toAgencyWithRights(agency)];

      const expectedAgencyPublicDisplay: AgencyPublicDisplayDto = {
        id: agency.id,
        name: agency.name,
        kind: agency.kind,
        signature: agency.signature,
        position: agency.position,
        address: agency.address,
        agencySiret: agency.agencySiret,
        logoUrl: agency.logoUrl,
        refersToAgency: null,
      };

      expectToEqual(
        await useCase.execute({ agencyId: agency.id }),
        expectedAgencyPublicDisplay,
      );
    });
  });

  describe("Wrong path", () => {
    it("Should throw NotFoundError if agency does not exist", async () => {
      await expectPromiseToFailWithError(
        useCase.execute({ agencyId: agency.id }),
        errors.agency.notFound({ agencyId: agency.id }),
      );
    });

    it("Should throw if referred agency doesn't exist", async () => {
      uow.agencyRepository.agencies = [toAgencyWithRights(agency)];
      await expectPromiseToFailWithError(
        useCase.execute({ agencyId: agency2.id }),
        errors.agency.notFound({ agencyId: agency2.id }),
      );
    });
  });
});
