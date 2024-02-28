import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  displayRouteName,
  expectHttpResponseToEqual,
  expectToEqual,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { SuperTest, Test } from "supertest";
import { ApiConsumerBuilder } from "../../../../domains/core/api-consumer/adapters/InMemoryApiConsumerRepository";
import { GenerateApiConsumerJwt } from "../../../../domains/core/jwt";
import { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { buildTestApp } from "../../../../utils/buildTestApp";
import {
  PublicApiV2ConventionRoutes,
  publicApiV2ConventionRoutes,
} from "./publicApiV2.routes";

const agency = new AgencyDtoBuilder().build();

const convention = new ConventionDtoBuilder().withAgencyId(agency.id).build();
const conventionReadConsumerWithAgencyIdsScope = new ApiConsumerBuilder()
  .withConventionRight({
    kinds: ["READ"],
    scope: {
      agencyIds: [agency.id],
    },
    subscriptions: [],
  })
  .build();

const conventionReadConsumerWithNoScope = new ApiConsumerBuilder()
  .withId("convention-read-with-no-scope-id")
  .withConventionRight({
    kinds: ["READ"],
    scope: {
      agencyIds: [],
    },
    subscriptions: [],
  })
  .build();

const conventionUnauthorizedConsumer = new ApiConsumerBuilder()
  .withId("unauthorized-consumer-id")
  .withConventionRight({
    kinds: [],
    scope: {
      agencyIds: [],
    },
    subscriptions: [],
  })
  .build();

describe("Convention routes", () => {
  let request: SuperTest<Test>;
  let generateApiConsumerJwt: GenerateApiConsumerJwt;
  let sharedRequest: HttpClient<PublicApiV2ConventionRoutes>;
  let conventionReadConsumerWithAgencyIdsScopeToken: string;
  let conventionReadConsumerWithNoScopeToken: string;
  let conventionUnauthorizedConsumerToken: string;
  let inMemoryUow: InMemoryUnitOfWork;

  beforeEach(async () => {
    ({ request, generateApiConsumerJwt, inMemoryUow } = await buildTestApp());
    inMemoryUow.apiConsumerRepository.consumers = [
      conventionReadConsumerWithAgencyIdsScope,
      conventionReadConsumerWithNoScope,
      conventionUnauthorizedConsumer,
    ];
    conventionReadConsumerWithAgencyIdsScopeToken = generateApiConsumerJwt({
      id: conventionReadConsumerWithAgencyIdsScope.id,
    });
    conventionReadConsumerWithNoScopeToken = generateApiConsumerJwt({
      id: conventionReadConsumerWithNoScope.id,
    });
    conventionUnauthorizedConsumerToken = generateApiConsumerJwt({
      id: conventionUnauthorizedConsumer.id,
    });
    sharedRequest = createSupertestSharedClient(
      publicApiV2ConventionRoutes,
      request,
    );
  });

  describe(`${displayRouteName(
    publicApiV2ConventionRoutes.getConventionById,
  )} gets a convention from its id`, () => {
    it("401 - fails without apiKey", async () => {
      const { body, status } = await sharedRequest.getConventionById({
        headers: { authorization: "" },
        urlParams: { conventionId: "some-id" },
      });

      expectToEqual(body, { status: 401, message: "unauthenticated" });
      expectToEqual(status, 401);
    });

    it("403 when the apiConsumer has READ access to convention but no scope", async () => {
      inMemoryUow.agencyRepository.setAgencies([agency]);
      inMemoryUow.conventionRepository.setConventions([convention]);

      const { body, status } = await sharedRequest.getConventionById({
        headers: { authorization: conventionReadConsumerWithNoScopeToken },
        urlParams: { conventionId: convention.id },
      });

      expectToEqual(body, {
        status: 403,
        message: `You are not allowed to access convention : ${convention.id}`,
      });
      expectToEqual(status, 403);
    });

    it("403 when the consumer has no READ access to convention", async () => {
      const response = await sharedRequest.getConventionById({
        headers: { authorization: conventionUnauthorizedConsumerToken },
        urlParams: { conventionId: convention.id },
      });

      expectHttpResponseToEqual(response, {
        status: 403,
        body: {
          status: 403,
          message: "Accès refusé",
        },
      });
    });

    it("returns 200 with the convention", async () => {
      inMemoryUow.agencyRepository.setAgencies([agency]);
      inMemoryUow.conventionRepository.setConventions([convention]);

      expect(
        displayRouteName(publicApiV2ConventionRoutes.getConventionById),
      ).toBe("GET /v2/conventions/:conventionId -");
      const response = await sharedRequest.getConventionById({
        headers: {
          authorization: conventionReadConsumerWithAgencyIdsScopeToken,
        },
        urlParams: { conventionId: convention.id },
      });

      expectHttpResponseToEqual(response, {
        body: {
          ...convention,
          agencyName: agency.name,
          agencyDepartment: agency.address.departmentCode,
          agencyKind: agency.kind,
          agencySiret: agency.agencySiret,
          agencyCounsellorEmails: agency.counsellorEmails,
          agencyValidatorEmails: agency.validatorEmails,
        },
        status: 200,
      });
    });
  });

  describe(`${displayRouteName(
    publicApiV2ConventionRoutes.getConventions,
  )} get convention filtered by params`, () => {
    it("401 - fails without apiKey", async () => {
      const response = await sharedRequest.getConventions({
        headers: { authorization: "" },
        queryParams: {},
      });

      expectHttpResponseToEqual(response, {
        status: 401,
        body: {
          status: 401,
          message: "unauthenticated",
        },
      });
    });

    it("403 when the apiConsumer does not READ access on convention", async () => {
      const response = await sharedRequest.getConventions({
        headers: { authorization: conventionUnauthorizedConsumerToken },
        queryParams: {},
      });

      expectHttpResponseToEqual(response, {
        status: 403,
        body: {
          status: 403,
          message: "Accès refusé",
        },
      });
    });

    it("200 - returns the conventions matching agencyIds in scope", async () => {
      inMemoryUow.agencyRepository.setAgencies([agency]);
      inMemoryUow.conventionRepository.setConventions([convention]);

      expect(displayRouteName(publicApiV2ConventionRoutes.getConventions)).toBe(
        "GET /v2/conventions -",
      );
      const response = await sharedRequest.getConventions({
        headers: {
          authorization: conventionReadConsumerWithAgencyIdsScopeToken,
        },
        queryParams: {},
      });

      expectHttpResponseToEqual(response, {
        body: [
          {
            ...convention,
            agencyName: agency.name,
            agencyDepartment: agency.address.departmentCode,
            agencyKind: agency.kind,
            agencySiret: agency.agencySiret,
            agencyCounsellorEmails: agency.counsellorEmails,
            agencyValidatorEmails: agency.validatorEmails,
          },
        ],
        status: 200,
      });
    });
  });
});
