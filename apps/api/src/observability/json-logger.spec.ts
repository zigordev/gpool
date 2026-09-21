import { trace } from '@opentelemetry/api';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { writeLogRecord } from './json-logger';

const lines: Record<string, unknown>[] = [];

const capture = () => {
  lines.length = 0;
  vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    lines.push(JSON.parse(String(chunk)) as Record<string, unknown>);
    return true;
  });
};

const inSpan = (traceFlags: number) =>
  vi.spyOn(trace, 'getActiveSpan').mockReturnValue({
    spanContext: () => ({ traceId: 'a'.repeat(32), spanId: 'b'.repeat(16), traceFlags }),
  } as never);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('writeLogRecord', () => {
  it('names the trace of a sampled span, so Loki can open it', () => {
    inSpan(1);
    capture();

    writeLogRecord('info', 'listening');

    expect(lines[0]).toMatchObject({ traceId: 'a'.repeat(32), spanId: 'b'.repeat(16) });
  });

  it('names no trace for a span that was not sampled, because none was stored', () => {
    inSpan(0);
    capture();

    writeLogRecord('info', 'health probe');

    expect(lines[0]).not.toHaveProperty('traceId');
    expect(lines[0]).not.toHaveProperty('spanId');
  });

  it('names no trace outside a span', () => {
    capture();

    writeLogRecord('info', 'boot');

    expect(lines[0]).not.toHaveProperty('traceId');
  });
});
