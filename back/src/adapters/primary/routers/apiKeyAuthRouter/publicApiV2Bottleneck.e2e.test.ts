import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  type ConventionId,
  expectArraysToEqual,
  expectHttpResponseToEqual,
} from "shared";
import type { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import type { SuperTest, Test } from "supertest";
import { ApiConsumerBuilder } from "../../../../domains/core/api-consumer/adapters/InMemoryApiConsumerRepository";
import type { GenerateApiConsumerJwt } from "../../../../domains/core/jwt";
import type { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { toAgencyWithRights } from "../../../../utils/agency";
import { buildTestApp } from "../../../../utils/buildTestApp";
import {
  type PublicApiV2ConventionRoutes,
  publicApiV2ConventionRoutes,
} from "./publicApiV2.routes";

describe("bottleneck", () => {
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
      version: 1,
    });
    authorizationToken2 = generateApiConsumerJwt({
      id: consumer2.id,
      version: 1,
    });
    sharedRequest = createSupertestSharedClient(
      publicApiV2ConventionRoutes,
      request,
    );
  });

  it("fails when too many request for a same bottleneck group", async () => {
    inMemoryUow.agencyRepository.agencies = [toAgencyWithRights(agency)];
    inMemoryUow.conventionRepository.setConventions([convention]);

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
    inMemoryUow.agencyRepository.agencies = [toAgencyWithRights(agency)];
    inMemoryUow.conventionRepository.setConventions([convention]);

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
