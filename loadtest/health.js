import { check } from 'k6';
import http from 'k6/http';

const BASE = __ENV.API_BASE_URL || 'http://api:3000';

export const options = {
  vus: 10,
  duration: '15s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<200'],
    checks: ['rate>0.99'],
  },
};

export default function () {
  const res = http.get(`${BASE}/api/health`, {
    headers: { 'x-request-id': `k6-${__VU}-${__ITER}` },
  });

  check(res, { 'status is 200': (r) => r.status === 200 });
}
