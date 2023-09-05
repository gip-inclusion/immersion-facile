import { SuperTest, Test } from "supertest";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  displayRouteName,
  expectToEqual,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { ApiConsumerBuilder } from "../../../../_testBuilders/ApiConsumerBuilder";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { GenerateApiConsumerJwt } from "../../../../domain/auth/jwt";
import { InMemoryUnitOfWork } from "../../config/uowConfig";
import {
  PublicApiV2ConventionRoutes,
  publicApiV2ConventionRoutes,
} from "./publicApiV2.routes";

const agency = new AgencyDtoBuilder().build();
const convention = new ConventionDtoBuilder().withAgencyId(agency.id).build();
const authorizedConsumer = new ApiConsumerBuilder()
  .withConventionRight({
    kinds: ["READ"],
    scope: {
      agencyIds: [agency.id],
    },
  })
  .build();

const unauthorizedConsumer = new ApiConsumerBuilder()
  .withId("unauthorized-consumer-id")
  .withConventionRight({
    kinds: ["READ"],
    scope: {
      agencyIds: [],
    },
  })
  .build();

describe("Convention routes", () => {
  let request: SuperTest<Test>;
  let generateApiConsumerJwt: GenerateApiConsumerJwt;
  let sharedRequest: HttpClient<PublicApiV2ConventionRoutes>;
  let authorizedApiConsumerToken: string;
  let unauthorizedApiConsumerToken: string;
  let inMemoryUow: InMemoryUnitOfWork;

  beforeEach(async () => {
    ({ request, generateApiConsumerJwt, inMemoryUow } = await buildTestApp());
    inMemoryUow.apiConsumerRepository.consumers = [
      authorizedConsumer,
      unauthorizedConsumer,
    ];
    authorizedApiConsumerToken = generateApiConsumerJwt({
      id: authorizedConsumer.id,
    });
    unauthorizedApiConsumerToken = generateApiConsumerJwt({
      id: unauthorizedConsumer.id,
    });
    sharedRequest = createSupertestSharedClient(
      publicApiV2ConventionRoutes,
      request,
    );
  });

  describe(`${displayRouteName(
    publicApiV2ConventionRoutes.getConventionById,
  )} gets a convention from it's id`, () => {
    it("401 - fails without apiKey", async () => {
      const { body, status } = await sharedRequest.getConventionById({
        headers: { authorization: "" },
        urlParams: { conventionId: "some-id" },
      });

      expectToEqual(body, { status: 401, message: "unauthenticated" });
      expectToEqual(status, 401);
    });

    it("403 when the apiConsumer does not have enough privileges", async () => {
      inMemoryUow.agencyRepository.setAgencies([agency]);
      inMemoryUow.conventionRepository.setConventions({
        [convention.id]: convention,
      });

      const { body, status } = await sharedRequest.getConventionById({
        headers: { authorization: unauthorizedApiConsumerToken },
        urlParams: { conventionId: convention.id },
      });

      expectToEqual(body, {
        status: 403,
        message: `You are not allowed to access convention : ${convention.id}`,
      });
      expectToEqual(status, 403);
    });

    it("returns 200 with the convention", async () => {
      inMemoryUow.agencyRepository.setAgencies([agency]);
      inMemoryUow.conventionRepository.setConventions({
        [convention.id]: convention,
      });

      const { body, status } = await sharedRequest.getConventionById({
        headers: { authorization: authorizedApiConsumerToken },
        urlParams: { conventionId: convention.id },
      });

      expectToEqual(body, {
        ...convention,
        agencyName: agency.name,
        agencyDepartment: agency.address.departmentCode,
      });
      expectToEqual(status, 200);
    });
  });
});
