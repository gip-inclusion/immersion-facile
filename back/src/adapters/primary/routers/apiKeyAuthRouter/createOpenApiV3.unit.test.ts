import type { OpenAPIV3_1 as OpenAPI } from "openapi-types";
import { createOpenApiSpecV3 } from "./createOpenApiV3";
import { publicApiV3SearchEstablishmentRoutes } from "./publicApiV3.routes";

const toOpenApiPath = (url: string) => url.replace(/:(\w+)/g, "{$1}");

describe("createOpenApiSpecV3", () => {
  const spec = createOpenApiSpecV3("test");
  const paths = spec.paths!;

  const getOffersPath = publicApiV3SearchEstablishmentRoutes.getOffers.url;
  const getOfferPath = toOpenApiPath(
    publicApiV3SearchEstablishmentRoutes.getOffer.url,
  );
  const contactEstablishmentPath =
    publicApiV3SearchEstablishmentRoutes.contactEstablishment.url;

  describe("generates all V3 routes", () => {
    it("has getOffers route", () => {
      expect(paths[getOffersPath]).toBeDefined();
      expect(paths[getOffersPath]!.get).toBeDefined();
    });

    it("has getOffer route", () => {
      expect(paths[getOfferPath]).toBeDefined();
      expect(paths[getOfferPath]!.get).toBeDefined();
    });

    it("has contactEstablishment route", () => {
      expect(paths[contactEstablishmentPath]).toBeDefined();
      expect(paths[contactEstablishmentPath]!.post).toBeDefined();
    });
  });

  describe("documents contactEstablishment route completely", () => {
    const contactRoute = spec.paths![contactEstablishmentPath]!.post!;

    it("has request body with schema", () => {
      expect(contactRoute.requestBody).toBeDefined();
      const requestBody = contactRoute.requestBody as OpenAPI.RequestBodyObject;
      expect(requestBody.content["application/json"]).toBeDefined();
      expect(requestBody.content["application/json"].schema).toBeDefined();
    });

    it("has detailed request body schema with properties", () => {
      const requestBody = contactRoute.requestBody as OpenAPI.RequestBodyObject;
      const schema = requestBody.content["application/json"]
        .schema as OpenAPI.SchemaObject;

      expect(
        schema.type || schema.anyOf || schema.oneOf || schema.allOf,
      ).toBeDefined();
      expect(
        schema.properties || schema.anyOf || schema.oneOf || schema.allOf,
      ).toBeDefined();

      if (schema.properties) {
        expect(Object.keys(schema.properties).length).toBeGreaterThan(0);
        expect(schema.properties.kind).toBeDefined();
        expect(schema.properties.contactMode).toBeDefined();
        expect(schema.properties.siret).toBeDefined();
      }
    });

    it("has body examples for email and phone", () => {
      const requestBody = contactRoute.requestBody as OpenAPI.RequestBodyObject;
      const examples = requestBody.content["application/json"].examples;
      expect(examples).toBeDefined();
      expect(examples!.email).toBeDefined();
      expect((examples!.email as OpenAPI.ExampleObject).value).toBeDefined();
      expect(examples!.phone).toBeDefined();
      expect((examples!.phone as OpenAPI.ExampleObject).value).toBeDefined();
    });

    it("has authorization header parameter", () => {
      const authParam = contactRoute.parameters?.find(
        (p) =>
          (p as OpenAPI.ParameterObject).name === "authorization" &&
          (p as OpenAPI.ParameterObject).in === "header",
      );
      expect(authParam).toBeDefined();
    });

    it("has all expected responses", () => {
      expect(contactRoute.responses["201"]).toBeDefined();
      expect(contactRoute.responses["400"]).toBeDefined();
      expect(contactRoute.responses["401"]).toBeDefined();
      expect(contactRoute.responses["403"]).toBeDefined();
      expect(contactRoute.responses["404"]).toBeDefined();
      expect(contactRoute.responses["429"]).toBeDefined();
    });
  });

  describe("documents getOffer URL parameters", () => {
    const getOfferRoute = spec.paths![getOfferPath]!.get!;

    it("has siret parameter", () => {
      const siretParam = getOfferRoute.parameters?.find(
        (p) =>
          (p as OpenAPI.ParameterObject).name === "siret" &&
          (p as OpenAPI.ParameterObject).in === "path",
      );
      expect(siretParam).toBeDefined();
    });

    it("has appellationCode parameter", () => {
      const appellationParam = getOfferRoute.parameters?.find(
        (p) =>
          (p as OpenAPI.ParameterObject).name === "appellationCode" &&
          (p as OpenAPI.ParameterObject).in === "path",
      );
      expect(appellationParam).toBeDefined();
    });

    it("has locationId parameter", () => {
      const locationIdParam = getOfferRoute.parameters?.find(
        (p) =>
          (p as OpenAPI.ParameterObject).name === "locationId" &&
          (p as OpenAPI.ParameterObject).in === "path",
      );
      expect(locationIdParam).toBeDefined();
    });
  });
});
