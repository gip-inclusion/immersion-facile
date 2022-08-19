import {
  departmentCodeFromPostcodeUrl,
  lookupStreetAddressUrl,
} from "shared/src/address/address.query";
import {
  departmentCodeFromPostcodeRoute,
  lookupStreetAddressRoute,
} from "shared/src/routes";
import { SuperTest, Test } from "supertest";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import {
  expected8bdduportAddressAndPositions,
  query8bdduportLookup,
} from "../../../secondary/addressGateway/testUtils";

describe("addressRouter", () => {
  describe(`${lookupStreetAddressRoute} route`, () => {
    let request: SuperTest<Test>;

    beforeEach(async () => {
      ({ request } = await buildTestApp());
    });

    it(`GET ${lookupStreetAddressUrl(query8bdduportLookup)}`, async () => {
      const response = await request.get(
        lookupStreetAddressUrl(query8bdduportLookup),
      );
      expect(response.body).toEqual(expected8bdduportAddressAndPositions);
      expect(response.status).toBe(200);
    });
  });

  describe(`${departmentCodeFromPostcodeRoute} route`, () => {
    let request: SuperTest<Test>;

    beforeEach(async () => {
      ({ request } = await buildTestApp());
    });

    it(`GET ${departmentCodeFromPostcodeUrl("75001")}`, async () => {
      const response = await request.get(
        departmentCodeFromPostcodeUrl("75001"),
      );
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        departmentCode: "75",
      });
    });
  });
});
