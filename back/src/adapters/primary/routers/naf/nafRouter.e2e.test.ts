import {
  displayRouteName,
  expectHttpResponseToEqual,
  type NafRoutes,
  type NafSectionSuggestion,
  nafRoutes,
} from "shared";
import type { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import type { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { buildTestApp } from "../../../../utils/buildTestApp";

describe("naf Router", () => {
  const agricultureSection: NafSectionSuggestion = {
    label: "Agriculture",
    nafCodes: ["3215A", "7841A"],
  };

  const industriesExtractiveSection: NafSectionSuggestion = {
    label: "Industries extractives",
    nafCodes: ["7845C", "5578C"],
  };

  const industrieManufacturiereSection: NafSectionSuggestion = {
    label: "Industrie manufacturière",
    nafCodes: ["4587C", "9658C"],
  };

  let httpClient: HttpClient<NafRoutes>;
  let inMemoryUow: InMemoryUnitOfWork;

  beforeEach(async () => {
    const testApp = await buildTestApp();
    inMemoryUow = testApp.inMemoryUow;
    httpClient = createSupertestSharedClient(nafRoutes, testApp.request);
    inMemoryUow.nafRepository.nafSuggestions = [
      agricultureSection,
      industriesExtractiveSection,
      industrieManufacturiereSection,
    ];
  });

  describe(`${displayRouteName(nafRoutes.getAllNafSections)}`, () => {
    it("200 - returns all NAF sections", async () => {
      const response = await httpClient.getAllNafSections();
      expectHttpResponseToEqual(response, {
        body: [
          agricultureSection,
          industriesExtractiveSection,
          industrieManufacturiereSection,
        ],
        status: 200,
      });
    });

    it("400 - Bad Schema", async () => {
      const response = await httpClient.getAllNafSections();
      expectHttpResponseToEqual(response, {
        body: {
          message:
            "Shared-route schema 'queryParamsSchema' was not respected in adapter 'express'.\nRoute: GET /naf/section",
          status: 400,
          issues: ["searchText : Ce champ est obligatoire"],
        },
        status: 400,
      });
    });
  });
});
