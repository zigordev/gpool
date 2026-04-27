#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const input = process.argv[2] ?? 'artifacts/openapi.test.json';
const output = process.argv[3] ?? 'apps/ui/src/lib/api/generated.ts';

const raw = fs.readFileSync(input, 'utf8');
const spec = JSON.parse(raw);
const paths = spec.paths ?? {};
const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

const operations = [];

for (const [route, methods] of Object.entries(paths)) {
  for (const method of httpMethods) {
    const operation = methods?.[method];
    if (!operation) continue;

    const operationId = operation.operationId ?? `${method}_${route}`;
    const responseCodes = Object.keys(operation.responses ?? {});

    operations.push({
      method: method.toUpperCase(),
      path: route,
      operationId,
      responseCodes: responseCodes.length > 0 ? responseCodes : ['default'],
    });
  }
}

operations.sort((a, b) =>
  `${a.method}:${a.path}:${a.operationId}`.localeCompare(
    `${b.method}:${b.path}:${b.operationId}`,
  ),
);

const file = `// Auto-generated from OpenAPI. Do not edit by hand.
// Source: ${input}

export type ApiOperation = ${
  operations.length === 0
    ? 'never'
    : operations
        .map(
          (op) =>
            `{
  method: '${op.method}';
  path: '${op.path}';
  operationId: '${op.operationId}';
  responseCodes: [${op.responseCodes.map((code) => `'${code}'`).join(', ')}];
}`,
        )
        .join(' | ')
};

export const API_OPERATION_COUNT = ${operations.length} as const;

export const API_OPERATIONS = ${JSON.stringify(operations, null, 2)} as const;
`;

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, file, 'utf8');
console.log(`Generated ${output} from ${input} (${operations.length} operations)`);
