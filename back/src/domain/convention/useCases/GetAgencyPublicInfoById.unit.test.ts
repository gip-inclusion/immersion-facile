import {
  AgencyDtoBuilder,
  AgencyPublicDisplayDto,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { GetAgencyPublicInfoById } from "./GetAgencyPublicInfoById";

describe("GetAgencyPublicInfoById", () => {
  const agency = new AgencyDtoBuilder().withId("1").build();
  const agency2 = new AgencyDtoBuilder()
    .withRefersToAgencyId(agency.id)
    .withId("2")
    .build();
  let uow: InMemoryUnitOfWork;
  let useCase: GetAgencyPublicInfoById;
  beforeEach(() => {
    uow = createInMemoryUow();
    useCase = new GetAgencyPublicInfoById(new InMemoryUowPerformer(uow));
  });

  describe("Happy path", () => {
    it("Should return agency public info for agency with referred agency", async () => {
      uow.agencyRepository.setAgencies([agency, agency2]);

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
      uow.agencyRepository.setAgencies([agency]);

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
        new NotFoundError("Some agencies not found with ids : '1'."),
      );
    });

    it("Should throw if referred agency doesn't exist", async () => {
      uow.agencyRepository.setAgencies([agency]);
      await expectPromiseToFailWithError(
        useCase.execute({ agencyId: agency2.id }),
        new NotFoundError("Some agencies not found with ids : '2'."),
      );
    });
  });
});
