import { Counter, Histogram } from "prom-client";

// AUTH MIDDLEWARE
export const apiKeyAuthMiddlewareRequestsTotal = new Counter({
  name: "api_key_auth_middleware_requests_total",
  help: "The total count each api keys that tried to use the api",
  labelNames: ["route", "method", "consumerName", "authorisationStatus"],
});

//ESTABLISHMENT
export const counterFormEstablishmentCaller = new Counter({
  name: "form_establishment_callers_counter",
  help: "The total count form establishment adds, broken down by referer.",
  labelNames: ["referer"],
});

export const counterFormEstablishmentCallerV1 = new Counter({
  name: "form_establishment_v1_callers_counter",
  help: "The total count form establishment adds, broken down by referer.",
  labelNames: ["referer"],
});

//EVENT BUS
export const counterPublishedEventsTotal = new Counter({
  name: "in_memory_event_bus_published_events_total",
  help: "The total count of events published by InMemoryEventBus.",
  labelNames: ["topic"],
});

export const counterPublishedEventsSuccess = new Counter({
  name: "in_memory_event_bus_published_events_success",
  help: "The success count of events published by InMemoryEventBus.",
  labelNames: ["topic"],
});

export const counterPublishedEventsError = new Counter({
  name: "in_memory_event_bus_published_events_error",
  help: "The error count of events published by InMemoryEventBus.",
  labelNames: ["topic", "errorType"],
});

// OUTBOX REPOSITORY
export const counterEventsSavedBeforePublish = new Counter({
  name: "pg_outbox_repository_events_saved_before_publish",
  help: "The total count of events saved by PgOutboxRepository with no publication.",
  labelNames: ["topic", "wasQuarantined"],
});

// EMAIL
export const counterSendTransactEmailTotal = new Counter({
  name: "brevo_send_transac_email_total",
  help: "The total count of sendTransacEmail requests, broken down by email type.",
  labelNames: ["emailType"],
});

export const counterSendTransactEmailSuccess = new Counter({
  name: "brevo_send_transac_email_success",
  help: "The success count of sendTransacEmail requests, broken down by email type.",
  labelNames: ["emailType"],
});

export const counterSendTransactEmailError = new Counter({
  name: "brevo_send_transac_email_error",
  help: "The error count of sendTransacEmail requests, broken down by email type.",
  labelNames: ["emailType", "errorType"],
});

//PE CONNECT
export type CounterType =
  | "getUserStatutInfo"
  | "getAdvisorsInfo"
  | "getUserInfo"
  | "exchangeCodeForAccessToken";

const makeCounters = (counterType: CounterType) => ({
  success: new Counter({
    name: `peConnect_${counterType}_success`,
    help: `The number of ${counterType} success`,
  }),
  total: new Counter({
    name: `peConnect_${counterType}_total`,
    help: `The number of ${counterType} total`,
  }),
  error: new Counter<"errorType">({
    name: `peConnect_${counterType}_error`,
    help: `The number of ${counterType} errors, broken down by error type`,
    labelNames: ["errorType"],
  }),
});

export const getUserStatutInfoCounter = makeCounters("getUserStatutInfo");
export const getAdvisorsInfoCounter = makeCounters("getAdvisorsInfo");
export const getUserInfoCounter = makeCounters("getUserInfo");
export const exchangeCodeForAccessTokenCounter = makeCounters(
  "exchangeCodeForAccessToken",
);

// LBB
export const counterSearchImmersionLBBRequestsTotal = new Counter({
  name: "search_immersion_lbb_requests_total",
  help: "The total count of LBB request made in the search immersions use case",
});

export const counterSearchImmersionLBBRequestsError = new Counter({
  name: "search_immersion_lbb_requests_error",
  help: "The total count of failed LBB request made in the search immersions use case",
});

export const counterSearchImmersionLBBRequestsSkipped = new Counter({
  name: "search_immersion_lbb_requests_skipped",
  help: "The total count of skipped LBB request made in the search immersions use case",
});

// IMMERSION SEARCH HISTOGRAM
export const histogramSearchImmersionStoredCount = new Histogram({
  name: "search_immersion_stored_result_count",
  help: "Histogram of the number of result returned from storage",
  buckets: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
});
