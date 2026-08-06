import { frontRoutes } from "../routes/routes";
import { expectToEqual } from "../test.helpers";
import type { InitiateLoginByOAuthParams } from "./auth.dto";
import {
  getFrontRouteUriWithoutQueryParams,
  initiateLoginByOAuthParamsSchema,
} from "./auth.schema";

describe("auth.schema", () => {
  describe("getFrontRouteUriWithoutQueryParams", () => {
    it.each([
      {
        route: frontRoutes.admin,
        expected: "/admin",
      },
      {
        route: frontRoutes.myAccount,
        expected: "/mon-compte",
      },
      {
        route: frontRoutes.agencyDashboard,
        expected: "/mon-compte/tableau-de-bord-agence",
      },
      {
        route: frontRoutes.conventionImmersion,
        expected: "/demande-immersion",
      },
      {
        route: frontRoutes.conventionTemplate,
        expected: "/modele-convention",
      },
      {
        route: frontRoutes.manageConventionConnectedUser,
        expected: "/pilotage-convention-inclusion-connect",
      },
      {
        route: frontRoutes.agencyDashboardAgencyDetails,
        expected: "/mon-compte/tableau-de-bord-agence/agences",
      },
      {
        route: frontRoutes.beneficiaryDashboardDiscussions,
        expected: "/mon-compte/tableau-de-bord-beneficiaire/discussions",
      },
    ])("returns $expected", ({ route, expected }) => {
      expectToEqual(getFrontRouteUriWithoutQueryParams(route), expected);
    });
  });

  describe("initiateLoginByOAuthParamsSchema", () => {
    describe("valid params", () => {
      it("accepts redirectUri without query params", () => {
        const params: InitiateLoginByOAuthParams = {
          redirectUri: getFrontRouteUriWithoutQueryParams(frontRoutes.admin),
          provider: "proConnect",
        };

        expectToEqual(initiateLoginByOAuthParamsSchema.parse(params), params);
      });

      it("accepts allowed path with query params", () => {
        const params = {
          redirectUri: `${getFrontRouteUriWithoutQueryParams(frontRoutes.admin)}?token=abc`,
          provider: "proConnect",
        };

        expectToEqual(initiateLoginByOAuthParamsSchema.parse(params), params);
      });

      it("accepts allowed path with nested subpath", () => {
        const params = {
          redirectUri: `${getFrontRouteUriWithoutQueryParams(frontRoutes.agencyDashboard)}/abc`,
          provider: "peConnect",
        };

        expectToEqual(initiateLoginByOAuthParamsSchema.parse(params), params);
      });
    });

    describe("invalid params", () => {
      it.each([
        "@example.com",
        "/establishment@example.com",
        "//otherdomain.com",
        "https://otherdomain.com",
        "admin", // path without leading slash
        "/recherche", // not required to login
      ])("rejects redirectUri %s", (redirectUri) => {
        expect(() =>
          initiateLoginByOAuthParamsSchema.parse({
            redirectUri,
            provider: "proConnect",
          }),
        ).toThrow();
      });

      it("rejects invalid provider", () => {
        expect(() =>
          initiateLoginByOAuthParamsSchema.parse({
            redirectUri: getFrontRouteUriWithoutQueryParams(frontRoutes.admin),
            provider: "email",
          }),
        ).toThrow();
      });
    });
  });
});
