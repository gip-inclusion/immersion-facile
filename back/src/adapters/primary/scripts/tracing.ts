import * as opentelemetry from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import {
  BasicTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { ZipkinExporter } from "@opentelemetry/exporter-zipkin";
import { trace } from "@opentelemetry/api";

type AttributeValue = string | number | boolean;

export type AppSpan = {
  setAttributes: (attributes: Record<string, AttributeValue>) => AppSpan;
  setAttribute: (name: string, attributeValue: AttributeValue) => AppSpan;
  end: () => Promise<void>;
};

interface Tracer {
  startActiveSpan: <T>(spanName: string, cb: (span: AppSpan) => T) => T;
}

interface TracingSdk {
  start: () => Promise<void>;
}

type TracingUtils = {
  tracer: Tracer;
  tracingSdk: TracingSdk;
};

const setUpOpenTelemetryTracing = (zipkinHost: string): TracingUtils => {
  // For troubleshooting, set the log level to DiagLogLevel.DEBUG
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

  const exporter = new ZipkinExporter({
    url: `http://${zipkinHost}/api/v2/spans`,
  });

  const tracingSdk = new opentelemetry.NodeSDK({
    traceExporter: exporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-express": {
          enabled: true,
        },
        "@opentelemetry/instrumentation-pg": {
          enabled: true,
        },
        "@opentelemetry/instrumentation-http": {
          enabled: true,
        },
      }),
    ],
  });

  const provider = new BasicTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: "back",
    }),
  });
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register();

  trace.setGlobalTracerProvider(provider);

  const tracer = trace.getTracer("immersion-back");

  return {
    tracer,
    tracingSdk,
  };
};

const noTracer = (): TracingUtils => ({
  tracer: {
    startActiveSpan: (_name, cb) => {
      const fakeSpan: AppSpan = {
        setAttributes: (_attributes: Record<string, AttributeValue>) =>
          fakeSpan,
        setAttribute: (_name: string, _attributeValue: AttributeValue) =>
          fakeSpan,
        end: async () => {
          /*Nothing to do*/
        },
      };

      return cb(fakeSpan);
    },
  },
  tracingSdk: {
    start: async () => {
      /* Nothing to do */
    },
  },
});

export const { tracer, tracingSdk } = process.env.ZIPKIN_HOST
  ? setUpOpenTelemetryTracing(process.env.ZIPKIN_HOST)
  : noTracer();
