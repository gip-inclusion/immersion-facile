export const testConfig = {
  timeForDebounce: 600, // debounce time value * 2 for safety
  timeForEventCrawler: 2000, // event crawler time interval + 1s for safety
  inclusionConnect: {
    baseUrl: "https://recette.connect.inclusion.beta.gouv.fr",
    username: process.env.IC_USERNAME ?? "",
    password: process.env.IC_PASSWORD ?? "",
    adminUsername: "admin+playwright@immersion-facile.beta.gouv.fr",
    adminPassword: process.env.IC_ADMIN_PASSWORD ?? "",
  },
  adminAuthFile: ".auth/admin.json",
  establishmentAuthFile: ".auth/establishment.json",
  agencyAuthFile: ".auth/agency.json",
};
