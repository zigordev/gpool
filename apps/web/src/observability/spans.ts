import { SpanStatusCode, trace, type Attributes, type Span } from '@opentelemetry/api';

const TRACER_NAME = 'gpool-web';

export function tracer() {
  return trace.getTracer(TRACER_NAME);
}

export function withSpan<T>(
  name: string,
  run: (span: Span) => Promise<T>,
  attributes?: Attributes
): Promise<T> {
  return tracer().startActiveSpan(name, { attributes }, async (span) => {
    try {
      return await run(span);
    } catch (error) {
      if (error instanceof Error) span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.name : 'UnknownError',
      });
      throw error;
    } finally {
      span.end();
    }
  });
}
