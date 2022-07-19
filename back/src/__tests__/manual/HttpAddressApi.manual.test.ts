import { HttpAdresseAPI } from "../../adapters/secondary/immersionOffer/HttpAdresseAPI";
import { noRateLimit } from "../../domain/core/ports/RateLimiter";
import { noRetries } from "../../domain/core/ports/RetryStrategy";
import { expectTypeToMatchAndEqual } from "../../_testBuilders/test.helpers";

const resultFromApiAddress = {
  type: "FeatureCollection",
  version: "draft",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [7.511081, 48.532594],
      },
      properties: {
        label: "14 Rue Gaston Romazzotti 67120 Molsheim",
        score: 0.9999999831759846,
        housenumber: "14",
        id: "67300_0263_00014",
        name: "14 Rue Gaston Romazzotti",
        postcode: "67120",
        citycode: "67300",
        x: 1032871.72,
        y: 6835328.47,
        city: "Molsheim",
        context: "67, Bas-Rhin, Grand Est",
        type: "housenumber",
        importance: 0.55443,
        street: "Rue Gaston Romazzotti",
        distance: 6,
      },
    },
  ],
  attribution: "BAN",
  licence: "ETALAB-2.0",
  limit: 1,
};

describe("HttpLaBonneBoiteAPI", () => {
  it("Should return all `companies` susceptible to offer immerison of given rome located within the geographical area", async () => {
    const adapter = new HttpAdresseAPI(noRateLimit, noRetries);

    const result = await adapter.getAddressFromPosition({
      lat: resultFromApiAddress.features[0].geometry.coordinates[1],
      lon: resultFromApiAddress.features[0].geometry.coordinates[0],
    });

    expectTypeToMatchAndEqual(result, {
      streetNumberAndAddress: "14 Rue Gaston Romazzotti",
      city: "Molsheim",
      countyCode: "67",
      postCode: "67120",
    });
  });
});
