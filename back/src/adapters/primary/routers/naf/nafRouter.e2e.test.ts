import {
  type NafRoutes,
  type NafSectionSuggestion,
  type NafSectionSuggestionsParams,
  displayRouteName,
  expectHttpResponseToEqual,
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

  describe(`${displayRouteName(nafRoutes.nafSectionSuggestions)}`, () => {
    it("200 - One result with 'Agri'", async () => {
      const response = await httpClient.nafSectionSuggestions({
        queryParams: { searchText: "Agri" },
      });
      expectHttpResponseToEqual(response, {
        body: [agricultureSection],
        status: 200,
      });
    });

    it("200 - Multiple results with 'Indus'", async () => {
      const response = await httpClient.nafSectionSuggestions({
        queryParams: { searchText: "Indus" },
      });
      expectHttpResponseToEqual(response, {
        body: [industrieManufacturiereSection, industriesExtractiveSection],
        status: 200,
      });
    });

    it("200 - No results with 'dsklfsdmlf'", async () => {
      const response = await httpClient.nafSectionSuggestions({
        queryParams: { searchText: "dsklfsdmlf" },
      });
      expectHttpResponseToEqual(response, {
        body: [],
        status: 200,
      });
    });

    it("400 - Bad Schema", async () => {
      const response = await httpClient.nafSectionSuggestions({
        queryParams: {} as NafSectionSuggestionsParams,
      });
      expectHttpResponseToEqual(response, {
        body: {
          message:
            "Shared-route schema 'queryParamsSchema' was not respected in adapter 'express'.\nRoute: GET /naf/section",
          status: 400,
          issues: ["searchText : Obligatoire"],
        },
        status: 400,
      });
    });
  });
});
