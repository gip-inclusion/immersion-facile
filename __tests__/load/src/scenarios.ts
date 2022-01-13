import { Options } from "k6/options";

// A fast and simple scenario to check that tests work when there are multiple VUS.
const debugOptions = () => ({
  vus: 10,
  duration: "10s",
});

// Gradual load increase. Aborts when the server returns too many errors.
const stresstestOptions = () => {
  const rampDuration = "30s";
  const holdDuration = "1m30s";
  const loads = [100, 1_000, 2_000, 5_000];
  return {
    vus: 10,
    stages: [
      // Warm up.
      { duration: holdDuration, target: 10 },

      // Ramp up and hold.
      ...loads.flatMap((target) => [
        { duration: rampDuration, target },
        { duration: holdDuration, target },
      ]),
    ],

    thresholds: {
      // Abort if the HTTP error rate exceeds 5% for > 10s.
      http_req_failed: [
        {
          threshold: "rate<0.05",
          delayAbortEval: "10s",
          abortOnFail: true,
        },
      ],
    },
  };
};

// Normal load with repeated spikes of ever increasing load. Aborts when the server
// returns too many errors.
const spiketestOptions = () => {
  const normalLoad = 10;
  const spikeLoads = [100, 1_000, 2_000, 5_000];
  const rampUpDuration = "2s";
  const spikeDuration = "10s";
  const rampDownDuration = "2s";
  const recoveryDuration = "1m";

  return {
    vus: normalLoad,
    stages: [
      // Warm up
      { duration: "1m", target: normalLoad },

      // Spike and recover.
      ...spikeLoads.flatMap((target) => [
        { duration: rampUpDuration, target },
        { duration: spikeDuration, target },
        { duration: rampDownDuration, target: normalLoad },
        { duration: recoveryDuration, target: normalLoad },
      ]),
    ],

    thresholds: {
      // Abort if the HTTP error rate exceeds 5% for > 2s.
      http_req_failed: [
        {
          threshold: "rate<0.05",
          delayAbortEval: "2s",
          abortOnFail: true,
        },
      ],
    },
  };
};

const ALL_SCENARIOS: { [key: string]: Options } = {
  debug: debugOptions(),
  stresstest: stresstestOptions(),
  spiketest: spiketestOptions(),
};

export const getOptionsForScenario = (name: string): Options => {
  const options = ALL_SCENARIOS[name];
  if (!options) throw new Error(`Scenario not found: ${name}`);
  return options;
};
