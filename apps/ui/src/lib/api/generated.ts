// Auto-generated from OpenAPI. Do not edit by hand.
// Source: artifacts/openapi.test.json

export type ApiOperation = {
  method: 'DELETE';
  path: '/api/pools/{poolId}';
  operationId: 'PoolController_deletePool';
  responseCodes: ['200', '403', '404'];
} | {
  method: 'DELETE';
  path: '/api/pools/{poolId}/members/{userId}';
  operationId: 'PoolController_removeMember';
  responseCodes: ['200', '403', '404'];
} | {
  method: 'GET';
  path: '/api/auth/me';
  operationId: 'AuthController_getMe';
  responseCodes: ['200', '401'];
} | {
  method: 'GET';
  path: '/api/health';
  operationId: 'HealthController_check';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/api/health/live';
  operationId: 'HealthController_live';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/api/health/ready';
  operationId: 'HealthController_ready';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/api/pools';
  operationId: 'PoolController_listPools';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/api/pools/{poolId}';
  operationId: 'PoolController_getPool';
  responseCodes: ['200', '404'];
} | {
  method: 'GET';
  path: '/api/pools/{poolId}/bracket';
  operationId: 'BracketController_getBracket';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/api/pools/{poolId}/bracket/predictions';
  operationId: 'BracketController_getUserPredictions';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/api/pools/{poolId}/matches';
  operationId: 'MatchController_getMatches';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/api/pools/{poolId}/matches/predictions';
  operationId: 'MatchController_getUserPredictions';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/api/pools/{poolId}/matches/ranking';
  operationId: 'MatchController_getPoolRanking';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/api/pools/{poolId}/matches/teams';
  operationId: 'MatchController_getAllTeams';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/api/pools/{poolId}/matches/teams/group/{group}';
  operationId: 'MatchController_getTeamsByGroup';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/api/pools/{poolId}/members';
  operationId: 'PoolController_getPoolMembers';
  responseCodes: ['200', '403', '404'];
} | {
  method: 'GET';
  path: '/metrics';
  operationId: 'MetricsController_getMetrics';
  responseCodes: ['200'];
} | {
  method: 'POST';
  path: '/api/auth/google/transfer';
  operationId: 'AuthController_googleTransfer';
  responseCodes: ['200', '401'];
} | {
  method: 'POST';
  path: '/api/pools';
  operationId: 'PoolController_createPool';
  responseCodes: ['201', '403'];
} | {
  method: 'POST';
  path: '/api/pools/{poolId}/accept-invitation';
  operationId: 'PoolController_acceptInvitation';
  responseCodes: ['200', '404'];
} | {
  method: 'POST';
  path: '/api/pools/{poolId}/accept-request/{userId}';
  operationId: 'PoolController_acceptAccessRequest';
  responseCodes: ['200', '403', '404'];
} | {
  method: 'POST';
  path: '/api/pools/{poolId}/bracket/matches/{bracketMatchId}/predict';
  operationId: 'BracketController_createPrediction';
  responseCodes: ['200'];
} | {
  method: 'POST';
  path: '/api/pools/{poolId}/bracket/phases/{phase}';
  operationId: 'BracketController_createPhase';
  responseCodes: ['201', '400'];
} | {
  method: 'POST';
  path: '/api/pools/{poolId}/bracket/re-evaluate';
  operationId: 'BracketController_reEvaluateAll';
  responseCodes: ['200'];
} | {
  method: 'POST';
  path: '/api/pools/{poolId}/invite';
  operationId: 'PoolController_inviteUser';
  responseCodes: ['200', '403', '404'];
} | {
  method: 'POST';
  path: '/api/pools/{poolId}/leave';
  operationId: 'PoolController_leavePool';
  responseCodes: ['200', '400', '404'];
} | {
  method: 'POST';
  path: '/api/pools/{poolId}/matches/{matchId}/predict';
  operationId: 'MatchController_submitPrediction';
  responseCodes: ['200', '400', '404'];
} | {
  method: 'POST';
  path: '/api/pools/{poolId}/matches/{matchId}/results';
  operationId: 'MatchController_updateMatchResults';
  responseCodes: ['200', '400', '404'];
} | {
  method: 'POST';
  path: '/api/pools/{poolId}/request-access';
  operationId: 'PoolController_requestAccess';
  responseCodes: ['200', '400', '404'];
} | {
  method: 'POST';
  path: '/api/rum/events';
  operationId: 'RUMController_receiveEvents';
  responseCodes: ['200'];
} | {
  method: 'PUT';
  path: '/api/pools/{poolId}';
  operationId: 'PoolController_updatePool';
  responseCodes: ['200', '403', '404'];
} | {
  method: 'PUT';
  path: '/api/pools/{poolId}/bracket/matches/{bracketMatchId}/result';
  operationId: 'BracketController_updateResult';
  responseCodes: ['200'];
} | {
  method: 'PUT';
  path: '/api/pools/{poolId}/bracket/matches/{bracketMatchId}/team';
  operationId: 'BracketController_updateTeam';
  responseCodes: ['200'];
} | {
  method: 'PUT';
  path: '/api/pools/{poolId}/configuration';
  operationId: 'PoolController_updatePoolConfiguration';
  responseCodes: ['200', '403', '404'];
};

export const API_OPERATION_COUNT = 34 as const;

export const API_OPERATIONS = [
  {
    "method": "DELETE",
    "path": "/api/pools/{poolId}",
    "operationId": "PoolController_deletePool",
    "responseCodes": [
      "200",
      "403",
      "404"
    ]
  },
  {
    "method": "DELETE",
    "path": "/api/pools/{poolId}/members/{userId}",
    "operationId": "PoolController_removeMember",
    "responseCodes": [
      "200",
      "403",
      "404"
    ]
  },
  {
    "method": "GET",
    "path": "/api/auth/me",
    "operationId": "AuthController_getMe",
    "responseCodes": [
      "200",
      "401"
    ]
  },
  {
    "method": "GET",
    "path": "/api/health",
    "operationId": "HealthController_check",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/api/health/live",
    "operationId": "HealthController_live",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/api/health/ready",
    "operationId": "HealthController_ready",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/api/pools",
    "operationId": "PoolController_listPools",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/api/pools/{poolId}",
    "operationId": "PoolController_getPool",
    "responseCodes": [
      "200",
      "404"
    ]
  },
  {
    "method": "GET",
    "path": "/api/pools/{poolId}/bracket",
    "operationId": "BracketController_getBracket",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/api/pools/{poolId}/bracket/predictions",
    "operationId": "BracketController_getUserPredictions",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/api/pools/{poolId}/matches",
    "operationId": "MatchController_getMatches",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/api/pools/{poolId}/matches/predictions",
    "operationId": "MatchController_getUserPredictions",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/api/pools/{poolId}/matches/ranking",
    "operationId": "MatchController_getPoolRanking",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/api/pools/{poolId}/matches/teams",
    "operationId": "MatchController_getAllTeams",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/api/pools/{poolId}/matches/teams/group/{group}",
    "operationId": "MatchController_getTeamsByGroup",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/api/pools/{poolId}/members",
    "operationId": "PoolController_getPoolMembers",
    "responseCodes": [
      "200",
      "403",
      "404"
    ]
  },
  {
    "method": "GET",
    "path": "/metrics",
    "operationId": "MetricsController_getMetrics",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "POST",
    "path": "/api/auth/google/transfer",
    "operationId": "AuthController_googleTransfer",
    "responseCodes": [
      "200",
      "401"
    ]
  },
  {
    "method": "POST",
    "path": "/api/pools",
    "operationId": "PoolController_createPool",
    "responseCodes": [
      "201",
      "403"
    ]
  },
  {
    "method": "POST",
    "path": "/api/pools/{poolId}/accept-invitation",
    "operationId": "PoolController_acceptInvitation",
    "responseCodes": [
      "200",
      "404"
    ]
  },
  {
    "method": "POST",
    "path": "/api/pools/{poolId}/accept-request/{userId}",
    "operationId": "PoolController_acceptAccessRequest",
    "responseCodes": [
      "200",
      "403",
      "404"
    ]
  },
  {
    "method": "POST",
    "path": "/api/pools/{poolId}/bracket/matches/{bracketMatchId}/predict",
    "operationId": "BracketController_createPrediction",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "POST",
    "path": "/api/pools/{poolId}/bracket/phases/{phase}",
    "operationId": "BracketController_createPhase",
    "responseCodes": [
      "201",
      "400"
    ]
  },
  {
    "method": "POST",
    "path": "/api/pools/{poolId}/bracket/re-evaluate",
    "operationId": "BracketController_reEvaluateAll",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "POST",
    "path": "/api/pools/{poolId}/invite",
    "operationId": "PoolController_inviteUser",
    "responseCodes": [
      "200",
      "403",
      "404"
    ]
  },
  {
    "method": "POST",
    "path": "/api/pools/{poolId}/leave",
    "operationId": "PoolController_leavePool",
    "responseCodes": [
      "200",
      "400",
      "404"
    ]
  },
  {
    "method": "POST",
    "path": "/api/pools/{poolId}/matches/{matchId}/predict",
    "operationId": "MatchController_submitPrediction",
    "responseCodes": [
      "200",
      "400",
      "404"
    ]
  },
  {
    "method": "POST",
    "path": "/api/pools/{poolId}/matches/{matchId}/results",
    "operationId": "MatchController_updateMatchResults",
    "responseCodes": [
      "200",
      "400",
      "404"
    ]
  },
  {
    "method": "POST",
    "path": "/api/pools/{poolId}/request-access",
    "operationId": "PoolController_requestAccess",
    "responseCodes": [
      "200",
      "400",
      "404"
    ]
  },
  {
    "method": "POST",
    "path": "/api/rum/events",
    "operationId": "RUMController_receiveEvents",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "PUT",
    "path": "/api/pools/{poolId}",
    "operationId": "PoolController_updatePool",
    "responseCodes": [
      "200",
      "403",
      "404"
    ]
  },
  {
    "method": "PUT",
    "path": "/api/pools/{poolId}/bracket/matches/{bracketMatchId}/result",
    "operationId": "BracketController_updateResult",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "PUT",
    "path": "/api/pools/{poolId}/bracket/matches/{bracketMatchId}/team",
    "operationId": "BracketController_updateTeam",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "PUT",
    "path": "/api/pools/{poolId}/configuration",
    "operationId": "PoolController_updatePoolConfiguration",
    "responseCodes": [
      "200",
      "403",
      "404"
    ]
  }
] as const;
