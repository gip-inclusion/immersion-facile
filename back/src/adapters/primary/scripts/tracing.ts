import * as opentelemetry from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import {
  BasicTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
// import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { ZipkinExporter } from "@opentelemetry/exporter-zipkin";
import { trace } from "@opentelemetry/api";

// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const exporter = new ZipkinExporter({
  url: "http://192.168.1.26:9411/api/v2/spans",
});

export const tracingSdk = new opentelemetry.NodeSDK({
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

export const tracer = trace.getTracer("immersion-back");

trace.setGlobalTracerProvider(provider);
