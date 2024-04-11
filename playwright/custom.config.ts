export const testConfig = {
  timeForDebounce: 600, // debounce time value * 2 for safety
  timeForEventCrawler: 2000, // event crawler time interval + 1s for safety
  inclusionConnect: {
    baseUrl: "https://recette.connect.inclusion.beta.gouv.fr",
    username: process.env.IC_USERNAME ?? "",
    password: process.env.IC_PASSWORD ?? "",
  },
};
