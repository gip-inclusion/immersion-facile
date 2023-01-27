import { appellationRoute, romeRoute } from "shared";
import { SuperTest, Test } from "supertest";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";

describe(`/${appellationRoute} route`, () => {
  let request: SuperTest<Test>;

  beforeEach(async () => {
    ({ request } = await buildTestApp());
  });

  it("forwards valid requests", async () => {
    const response = await request.get(`/${appellationRoute}?searchText=trail`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        appellation: {
          appellationCode: "20714",
          appellationLabel: "Vitrailliste",
          romeCode: "B1602",
          romeLabel: "Vitraillerie",
        },
        matchRanges: [
          {
            startIndexInclusive: 2,
            endIndexExclusive: 7,
          },
        ],
      },
    ]);
  });
});

describe(`/${romeRoute} route`, () => {
  let request: SuperTest<Test>;

  beforeEach(async () => {
    ({ request } = await buildTestApp());
  });

  it("forwards valid requests", async () => {
    await request.get(`/${romeRoute}?searchText=rails`).expect(200, [
      {
        romeCode: "N4301",
        romeLabel: "Conduite sur rails",
      },
    ]);
  });
});
