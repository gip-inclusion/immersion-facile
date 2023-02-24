import {
  agenciesRoute,
  CreateAgencyDto,
  expectTypeToMatchAndEqual,
} from "shared";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";

describe("Route to add Agency", () => {
  it("support posting valid agency", async () => {
    const { request, inMemoryUow, appConfig } = await buildTestApp();
    inMemoryUow.agencyRepository.setAgencies([]);
    const parisMissionLocaleParams: CreateAgencyDto = {
      id: "some-id",
      address: {
        streetNumberAndAddress: "Agency 1 address",
        city: "Paris",
        postcode: "75001",
        departmentCode: "75",
      },
      counsellorEmails: ["counsellor@mail.com"],
      validatorEmails: ["validator@mail.com"],
      kind: "mission-locale",
      name: "Mission locale de Paris",
      position: { lat: 10, lon: 20 },
      questionnaireUrl: "www.myUrl.com",
      signature: "Super signature of the agency",
      agencySiret: "01234567891234",
    };

    const response = await request
      .post(`/${agenciesRoute}`)
      .send(parisMissionLocaleParams);

    expect(response.status).toBe(200);

    const inRepo = inMemoryUow.agencyRepository.agencies;
    expectTypeToMatchAndEqual(inRepo, [
      {
        ...parisMissionLocaleParams,
        questionnaireUrl: parisMissionLocaleParams.questionnaireUrl!,
        adminEmails: [appConfig.defaultAdminEmail],
        status: "needsReview",
      },
    ]);
  });
});
