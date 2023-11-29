import { SuperTest, Test } from "supertest";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  ConventionId,
  expectArraysToEqual,
  expectHttpResponseToEqual,
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

const createApiCall = (
  sharedRequest: HttpClient<PublicApiV2ConventionRoutes>,
  authorization: string,
  conventionId: ConventionId,
) =>
  sharedRequest.getConventionById({
    headers: {
      authorization,
    },
    urlParams: { conventionId },
  });

const agency = new AgencyDtoBuilder().build();

const convention = new ConventionDtoBuilder().withAgencyId(agency.id).build();

const consumer1 = new ApiConsumerBuilder()
  .withId("id-consumer-1")
  .withConventionRight({
    kinds: ["READ"],
    scope: {
      agencyIds: [agency.id],
    },
    subscriptions: [],
  })
  .build();

const consumer2 = new ApiConsumerBuilder()
  .withId("id-consumer-2")
  .withConventionRight({
    kinds: ["READ"],
    scope: {
      agencyIds: [agency.id],
    },
    subscriptions: [],
  })
  .build();

describe("bottleneck", () => {
  let request: SuperTest<Test>;
  let generateApiConsumerJwt: GenerateApiConsumerJwt;
  let sharedRequest: HttpClient<PublicApiV2ConventionRoutes>;
  let authorizationToken1: string;
  let authorizationToken2: string;
  let inMemoryUow: InMemoryUnitOfWork;

  beforeEach(async () => {
    ({ request, generateApiConsumerJwt, inMemoryUow } = await buildTestApp());
    inMemoryUow.apiConsumerRepository.consumers = [consumer1, consumer2];
    authorizationToken1 = generateApiConsumerJwt({
      id: consumer1.id,
    });
    authorizationToken2 = generateApiConsumerJwt({
      id: consumer2.id,
    });
    sharedRequest = createSupertestSharedClient(
      publicApiV2ConventionRoutes,
      request,
    );
  });

  it("fails when too many request for a same bottleneck group", async () => {
    inMemoryUow.agencyRepository.setAgencies([agency]);
    inMemoryUow.conventionRepository.setConventions({
      [convention.id]: convention,
    });

    const response = await Promise.all([
      createApiCall(sharedRequest, authorizationToken1, convention.id),
      createApiCall(sharedRequest, authorizationToken1, convention.id),
      createApiCall(sharedRequest, authorizationToken1, convention.id),
    ]);

    expectArraysToEqual(
      response.map((res) => res.status),
      [200, 200, 429],
    );
    expectHttpResponseToEqual(response[2], {
      status: 429,
      body: {
        message: "Too many requests, please try again later.",
        status: 429,
      },
    });
  });

  it("success when two different bottleneck groups", async () => {
    inMemoryUow.agencyRepository.setAgencies([agency]);
    inMemoryUow.conventionRepository.setConventions({
      [convention.id]: convention,
    });

    const response = await Promise.all([
      createApiCall(sharedRequest, authorizationToken1, convention.id),
      createApiCall(sharedRequest, authorizationToken1, convention.id),
      createApiCall(sharedRequest, authorizationToken2, convention.id),
    ]);

    expectArraysToEqual(
      response.map((res) => res.status),
      [200, 200, 200],
    );
  });
});
