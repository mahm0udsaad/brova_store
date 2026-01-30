import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
console.log("Initializing OpenTelemetry for Vercel...");

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]: 'brova-y-otel',
  }),
  // For demo purposes, we'll export to the console.
  // In a production environment, you would use a real exporter, e.g., OTLPExporter
  spanProcessor: new SimpleSpanProcessor(new ConsoleSpanExporter()),
});

sdk.start();

console.log("OpenTelemetry SDK started.");

// Gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
