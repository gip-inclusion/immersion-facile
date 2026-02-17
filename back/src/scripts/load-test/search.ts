import http from "k6/http";
import { check } from "k6";
import {
  fitForDisabledWorkersOptions,
  remoteWorkModes,
  searchImmersionRoutes,
  searchSortedByOptions,
} from "shared";
import { pickRandom, pickRandomSubset } from "./utils";

const getOffersUrl = searchImmersionRoutes.getOffers.url;

export const options = {
  stages: [
    { duration: "10s", target: 10 },
    { duration: "30s", target: 50 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.1"],
  },
};

const locations = [
  { latitude: 48.8566, longitude: 2.3522, label: "Paris" },
  { latitude: 43.2965, longitude: 5.3698, label: "Marseille" },
  { latitude: 45.764, longitude: 4.8357, label: "Lyon" },
  { latitude: 43.6047, longitude: 1.4442, label: "Toulouse" },
  { latitude: 44.8378, longitude: -0.5792, label: "Bordeaux" },
  { latitude: 47.2184, longitude: -1.5536, label: "Nantes" },
  { latitude: 48.5734, longitude: 7.7521, label: "Strasbourg" },
];

const appellationCodes = [
  "11573",
  "11574",
  "11564",
  "14829",
  "12694",
  "19540",
  "16067",
];

const distanceKmValues = [5, 10, 20, 30, 50, 100];
const perPageValues = [10, 20, 50];

const maybePick = <T>(items: readonly T[]): T | undefined =>
  Math.random() > 0.5 ? pickRandom(items) : undefined;

const buildRandomQueryParams = (): string => {
  const sortBy = pickRandom(searchSortedByOptions);
  const location = pickRandom(locations);

  const params: string[] = [`sortBy=${sortBy}`];

  if (sortBy === "distance") {
    params.push(
      `latitude=${location.latitude}`,
      `longitude=${location.longitude}`,
      `distanceKm=${pickRandom(distanceKmValues)}`,
    );
  } else if (Math.random() > 0.5) {
    params.push(
      `latitude=${location.latitude}`,
      `longitude=${location.longitude}`,
    );
  }

  const selectedAppellations = pickRandomSubset(appellationCodes);
  for (const code of selectedAppellations)
    params.push(`appellationCodes[]=${code}`);

  const selectedRemoteWorkModes = pickRandomSubset(remoteWorkModes);
  for (const mode of selectedRemoteWorkModes)
    params.push(`remoteWorkModes[]=${mode}`);

  const selectedFitForDisabled = pickRandomSubset(fitForDisabledWorkersOptions);
  for (const value of selectedFitForDisabled)
    params.push(`fitForDisabledWorkers[]=${value}`);

  if (Math.random() > 0.5) params.push("showOnlyAvailableOffers=true");

  params.push(`page=${Math.floor(Math.random() * 5) + 1}`);
  params.push(`perPage=${pickRandom(perPageValues)}`);

  return params.join("&");
};

const getOffersWithoutParams = () => {
  const url = `${BASE_URL}${getOffersUrl}?sortBy=date`;
  const response = http.get(url);
  check(response, {
    "GET /offers without params - status is 200": (r) => r.status === 200,
    "GET /offers without params - response time < 2s": (r) =>
      r.timings.duration < 2000,
  });
};

const getOffersWithParams = () => {
  const queryParams = buildRandomQueryParams();
  const url = `${BASE_URL}${getOffersUrl}?${queryParams}`;
  const response = http.get(url);
  check(response, {
    "GET /offers with params - status is 200": (r) => r.status === 200,
    "GET /offers with params - response time < 2s": (r) =>
      r.timings.duration < 2000,
  });
};