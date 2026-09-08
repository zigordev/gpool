// Auto-generated from OpenAPI. Do not edit by hand.
// Source: artifacts/openapi.test.json

export type ApiOperation = {
  method: 'DELETE';
  path: '/pools/{poolId}';
  operationId: 'PoolController_deletePool';
  responseCodes: ['200', '403', '404'];
} | {
  method: 'GET';
  path: '/auth/google';
  operationId: 'AuthController_googleLogin';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/auth/google/callback';
  operationId: 'AuthController_googleCallback';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/auth/me';
  operationId: 'AuthController_getMe';
  responseCodes: ['200', '401'];
} | {
  method: 'GET';
  path: '/health';
  operationId: 'HealthController_check';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/metrics';
  operationId: 'MetricsController_getMetrics';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/pools';
  operationId: 'PoolController_listPools';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/pools/{poolId}';
  operationId: 'PoolController_getPool';
  responseCodes: ['200', '404'];
} | {
  method: 'GET';
  path: '/pools/{poolId}/bracket';
  operationId: 'BracketController_getBracket';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/pools/{poolId}/bracket/predictions';
  operationId: 'BracketController_getUserPredictions';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/pools/{poolId}/bracket/winner-insights';
  operationId: 'BracketController_getWinnerInsights';
  responseCodes: ['200', '403'];
} | {
  method: 'GET';
  path: '/pools/{poolId}/matches';
  operationId: 'MatchController_getMatches';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/pools/{poolId}/matches/insights/{matchType}/{matchId}';
  operationId: 'MatchController_getMatchInsights';
  responseCodes: ['200', '400', '403', '404'];
} | {
  method: 'GET';
  path: '/pools/{poolId}/matches/predictions';
  operationId: 'MatchController_getUserPredictions';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/pools/{poolId}/matches/ranking';
  operationId: 'MatchController_getPoolRanking';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/pools/{poolId}/matches/teams';
  operationId: 'MatchController_getAllTeams';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/pools/{poolId}/members/{userId}/picks';
  operationId: 'SpyController_getMemberPicks';
  responseCodes: ['200', '403', '404'];
} | {
  method: 'GET';
  path: '/pools/{poolId}/players';
  operationId: 'PlayerController_getPlayers';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/pools/{poolId}/players/{playerId}/insights';
  operationId: 'PlayerController_getPlayerInsights';
  responseCodes: ['200', '400', '403', '404'];
} | {
  method: 'GET';
  path: '/pools/{poolId}/players/selection-statistics';
  operationId: 'PlayerController_getSelectionStatistics';
  responseCodes: ['200', '403'];
} | {
  method: 'PATCH';
  path: '/auth/me/locale';
  operationId: 'AuthController_updateLocale';
  responseCodes: ['200', '401'];
} | {
  method: 'POST';
  path: '/auth/logout';
  operationId: 'AuthController_logout';
  responseCodes: ['201'];
} | {
  method: 'POST';
  path: '/pools';
  operationId: 'PoolController_createPool';
  responseCodes: ['201', '403'];
} | {
  method: 'POST';
  path: '/pools/{poolId}/accept-invitation';
  operationId: 'PoolController_acceptInvitation';
  responseCodes: ['200', '404'];
} | {
  method: 'POST';
  path: '/pools/{poolId}/accept-request/{userId}';
  operationId: 'PoolController_acceptAccessRequest';
  responseCodes: ['200', '403', '404'];
} | {
  method: 'POST';
  path: '/pools/{poolId}/bracket/matches/{bracketMatchId}/predict';
  operationId: 'BracketController_createPrediction';
  responseCodes: ['200'];
} | {
  method: 'POST';
  path: '/pools/{poolId}/bracket/phases/{phase}';
  operationId: 'BracketController_createPhase';
  responseCodes: ['201', '400'];
} | {
  method: 'POST';
  path: '/pools/{poolId}/bracket/re-evaluate';
  operationId: 'BracketController_reEvaluateAll';
  responseCodes: ['200'];
} | {
  method: 'POST';
  path: '/pools/{poolId}/invite';
  operationId: 'PoolController_inviteUser';
  responseCodes: ['200', '403', '404'];
} | {
  method: 'POST';
  path: '/pools/{poolId}/matches/{matchId}/predict';
  operationId: 'MatchController_submitPrediction';
  responseCodes: ['200', '400', '404'];
} | {
  method: 'POST';
  path: '/pools/{poolId}/matches/{matchId}/results';
  operationId: 'MatchController_updateMatchResults';
  responseCodes: ['200', '400', '404'];
} | {
  method: 'POST';
  path: '/pools/{poolId}/request-access';
  operationId: 'PoolController_requestAccess';
  responseCodes: ['200', '400', '404'];
} | {
  method: 'PUT';
  path: '/pools/{poolId}';
  operationId: 'PoolController_updatePool';
  responseCodes: ['200', '403', '404'];
} | {
  method: 'PUT';
  path: '/pools/{poolId}/bracket/matches/{bracketMatchId}/result';
  operationId: 'BracketController_updateResult';
  responseCodes: ['200'];
} | {
  method: 'PUT';
  path: '/pools/{poolId}/bracket/matches/{bracketMatchId}/team';
  operationId: 'BracketController_updateTeam';
  responseCodes: ['200'];
} | {
  method: 'PUT';
  path: '/pools/{poolId}/configuration';
  operationId: 'PoolController_updatePoolConfiguration';
  responseCodes: ['200', '403', '404'];
} | {
  method: 'PUT';
  path: '/pools/{poolId}/matches/teams/{teamId}/fair-play';
  operationId: 'MatchController_updateTeamFairPlay';
  responseCodes: ['200', '400', '403', '404'];
} | {
  method: 'PUT';
  path: '/pools/{poolId}/players/{playerId}/stats';
  operationId: 'PlayerController_updatePlayerStats';
  responseCodes: ['200'];
} | {
  method: 'PUT';
  path: '/pools/{poolId}/players/award-result';
  operationId: 'PlayerController_updateAwardResult';
  responseCodes: ['200'];
} | {
  method: 'PUT';
  path: '/pools/{poolId}/players/award-selection';
  operationId: 'PlayerController_updateAwardSelection';
  responseCodes: ['200'];
} | {
  method: 'PUT';
  path: '/pools/{poolId}/players/selection';
  operationId: 'PlayerController_updateSelection';
  responseCodes: ['200'];
};

export const API_OPERATION_COUNT = 41 as const;

export const API_OPERATIONS = [
  {
    "method": "DELETE",
    "path": "/pools/{poolId}",
    "operationId": "PoolController_deletePool",
    "responseCodes": [
      "200",
      "403",
      "404"
    ]
  },
  {
    "method": "GET",
    "path": "/auth/google",
    "operationId": "AuthController_googleLogin",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/auth/google/callback",
    "operationId": "AuthController_googleCallback",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/auth/me",
    "operationId": "AuthController_getMe",
    "responseCodes": [
      "200",
      "401"
    ]
  },
  {
    "method": "GET",
    "path": "/health",
    "operationId": "HealthController_check",
    "responseCodes": [
      "200"
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
    "method": "GET",
    "path": "/pools",
    "operationId": "PoolController_listPools",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/pools/{poolId}",
    "operationId": "PoolController_getPool",
    "responseCodes": [
      "200",
      "404"
    ]
  },
  {
    "method": "GET",
    "path": "/pools/{poolId}/bracket",
    "operationId": "BracketController_getBracket",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/pools/{poolId}/bracket/predictions",
    "operationId": "BracketController_getUserPredictions",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/pools/{poolId}/bracket/winner-insights",
    "operationId": "BracketController_getWinnerInsights",
    "responseCodes": [
      "200",
      "403"
    ]
  },
  {
    "method": "GET",
    "path": "/pools/{poolId}/matches",
    "operationId": "MatchController_getMatches",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/pools/{poolId}/matches/insights/{matchType}/{matchId}",
    "operationId": "MatchController_getMatchInsights",
    "responseCodes": [
      "200",
      "400",
      "403",
      "404"
    ]
  },
  {
    "method": "GET",
    "path": "/pools/{poolId}/matches/predictions",
    "operationId": "MatchController_getUserPredictions",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/pools/{poolId}/matches/ranking",
    "operationId": "MatchController_getPoolRanking",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/pools/{poolId}/matches/teams",
    "operationId": "MatchController_getAllTeams",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/pools/{poolId}/members/{userId}/picks",
    "operationId": "SpyController_getMemberPicks",
    "responseCodes": [
      "200",
      "403",
      "404"
    ]
  },
  {
    "method": "GET",
    "path": "/pools/{poolId}/players",
    "operationId": "PlayerController_getPlayers",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/pools/{poolId}/players/{playerId}/insights",
    "operationId": "PlayerController_getPlayerInsights",
    "responseCodes": [
      "200",
      "400",
      "403",
      "404"
    ]
  },
  {
    "method": "GET",
    "path": "/pools/{poolId}/players/selection-statistics",
    "operationId": "PlayerController_getSelectionStatistics",
    "responseCodes": [
      "200",
      "403"
    ]
  },
  {
    "method": "PATCH",
    "path": "/auth/me/locale",
    "operationId": "AuthController_updateLocale",
    "responseCodes": [
      "200",
      "401"
    ]
  },
  {
    "method": "POST",
    "path": "/auth/logout",
    "operationId": "AuthController_logout",
    "responseCodes": [
      "201"
    ]
  },
  {
    "method": "POST",
    "path": "/pools",
    "operationId": "PoolController_createPool",
    "responseCodes": [
      "201",
      "403"
    ]
  },
  {
    "method": "POST",
    "path": "/pools/{poolId}/accept-invitation",
    "operationId": "PoolController_acceptInvitation",
    "responseCodes": [
      "200",
      "404"
    ]
  },
  {
    "method": "POST",
    "path": "/pools/{poolId}/accept-request/{userId}",
    "operationId": "PoolController_acceptAccessRequest",
    "responseCodes": [
      "200",
      "403",
      "404"
    ]
  },
  {
    "method": "POST",
    "path": "/pools/{poolId}/bracket/matches/{bracketMatchId}/predict",
    "operationId": "BracketController_createPrediction",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "POST",
    "path": "/pools/{poolId}/bracket/phases/{phase}",
    "operationId": "BracketController_createPhase",
    "responseCodes": [
      "201",
      "400"
    ]
  },
  {
    "method": "POST",
    "path": "/pools/{poolId}/bracket/re-evaluate",
    "operationId": "BracketController_reEvaluateAll",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "POST",
    "path": "/pools/{poolId}/invite",
    "operationId": "PoolController_inviteUser",
    "responseCodes": [
      "200",
      "403",
      "404"
    ]
  },
  {
    "method": "POST",
    "path": "/pools/{poolId}/matches/{matchId}/predict",
    "operationId": "MatchController_submitPrediction",
    "responseCodes": [
      "200",
      "400",
      "404"
    ]
  },
  {
    "method": "POST",
    "path": "/pools/{poolId}/matches/{matchId}/results",
    "operationId": "MatchController_updateMatchResults",
    "responseCodes": [
      "200",
      "400",
      "404"
    ]
  },
  {
    "method": "POST",
    "path": "/pools/{poolId}/request-access",
    "operationId": "PoolController_requestAccess",
    "responseCodes": [
      "200",
      "400",
      "404"
    ]
  },
  {
    "method": "PUT",
    "path": "/pools/{poolId}",
    "operationId": "PoolController_updatePool",
    "responseCodes": [
      "200",
      "403",
      "404"
    ]
  },
  {
    "method": "PUT",
    "path": "/pools/{poolId}/bracket/matches/{bracketMatchId}/result",
    "operationId": "BracketController_updateResult",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "PUT",
    "path": "/pools/{poolId}/bracket/matches/{bracketMatchId}/team",
    "operationId": "BracketController_updateTeam",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "PUT",
    "path": "/pools/{poolId}/configuration",
    "operationId": "PoolController_updatePoolConfiguration",
    "responseCodes": [
      "200",
      "403",
      "404"
    ]
  },
  {
    "method": "PUT",
    "path": "/pools/{poolId}/matches/teams/{teamId}/fair-play",
    "operationId": "MatchController_updateTeamFairPlay",
    "responseCodes": [
      "200",
      "400",
      "403",
      "404"
    ]
  },
  {
    "method": "PUT",
    "path": "/pools/{poolId}/players/{playerId}/stats",
    "operationId": "PlayerController_updatePlayerStats",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "PUT",
    "path": "/pools/{poolId}/players/award-result",
    "operationId": "PlayerController_updateAwardResult",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "PUT",
    "path": "/pools/{poolId}/players/award-selection",
    "operationId": "PlayerController_updateAwardSelection",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "PUT",
    "path": "/pools/{poolId}/players/selection",
    "operationId": "PlayerController_updateSelection",
    "responseCodes": [
      "200"
    ]
  }
] as const;
