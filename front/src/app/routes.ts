import { frontRoutes } from "src/shared/routes";
import { ScheduleDto } from "src/shared/ScheduleSchema";
import { createRouter, defineRoute, param, ValueSerializer } from "type-route";

const scheduleSerializer: ValueSerializer<ScheduleDto> = {
  parse: (raw) => JSON.parse(raw),
  stringify: (schedule) => JSON.stringify(schedule),
};

const defaultImmersionApplicationValues = {
  peExternalId: param.query.optional.string,
  email: param.query.optional.string,
  firstName: param.query.optional.string,
  lastName: param.query.optional.string,
  phone: param.query.optional.string,
  postalCode: param.query.optional.string,

  siret: param.query.optional.string,
  businessName: param.query.optional.string,
  mentor: param.query.optional.string,
  mentorPhone: param.query.optional.string,
  mentorEmail: param.query.optional.string,
  immersionAddress: param.query.optional.string,
  agencyId: param.query.optional.string,

  immersionObjective: param.query.optional.string,
  immersionProfession: param.query.optional.string,
  immersionActivities: param.query.optional.string,
  immersionSkills: param.query.optional.string,
  sanitaryPreventionDescription: param.query.optional.string,
  workConditions: param.query.optional.string,

  sanitaryPrevention: param.query.optional.boolean,
  individualProtection: param.query.optional.boolean,

  dateStart: param.query.optional.string,
  dateEnd: param.query.optional.string,

  schedule: param.query.optional.ofType(scheduleSerializer),
};

export type ApplicationFormKeysInUrl =
  keyof typeof defaultImmersionApplicationValues;

export const { RouteProvider, useRoute, routes } = createRouter({
  home: defineRoute("/"),
  landingEstablishment: defineRoute("/accueil-etablissement"),
  immersionApplication: defineRoute(
    { jwt: param.query.optional.string, ...defaultImmersionApplicationValues },
    () => "/demande-immersion",
  ),
  admin: defineRoute("/admin"),
  agencyAdmin: defineRoute(
    { agencyId: param.path.string },
    (p) => `/agence/${p.agencyId}`,
  ),
  adminVerification: defineRoute(
    { demandeId: param.path.string },
    (p) => `/admin-verification/${p.demandeId}`,
  ),
  immersionApplicationsToValidate: defineRoute(
    { jwt: param.query.string },
    () => `/${frontRoutes.immersionApplicationsToValidate}`,
  ),
  immersionApplicationsToSign: defineRoute(
    { jwt: param.query.string },
    () => `/${frontRoutes.immersionApplicationsToSign}`,
  ),
  formEstablishment: defineRoute([
    "/etablissement",
    "/immersion-offer" /* old name, still redirected*/,
  ]),

  formEstablishmentForIframes: defineRoute(
    { consumer: param.path.string },
    (p) => `/etablissement/${p.consumer}`,
  ),

  renewMagicLink: defineRoute(
    {
      expiredJwt: param.query.string,
      originalURL: param.query.string,
    },
    () => `/${frontRoutes.magicLinkRenewal}`,
  ),

  debugPopulateDB: defineRoute(
    { count: param.path.number },
    (p) => `/debug/populate/${p.count}`,
  ),
  searchDebug: defineRoute("/debug/search"),
  search: defineRoute("/recherche"),
});
