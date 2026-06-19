import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MatchService } from './match.service';
import { SessionUserGuard } from '../../common/auth/session-user.guard';
import { Request } from 'express';

@ApiTags('matches')
@Controller('pools/:poolId/matches')
@UseGuards(SessionUserGuard)
@ApiBearerAuth()
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get()
  @ApiOperation({ summary: 'Get all matches for a pool' })
  @ApiResponse({ status: 200, description: 'List of matches organized by groups' })
  async getMatches(@Param('poolId') poolId: string) {
    return this.matchService.getMatchesByPool(poolId);
  }

  @Get('teams')
  @ApiOperation({ summary: 'Get all teams' })
  @ApiResponse({ status: 200, description: 'List of all teams' })
  async getAllTeams() {
    return this.matchService.getAllTeams();
  }

  @Put('teams/:teamId/fair-play')
  @ApiOperation({ summary: 'Update team fair-play points (Admin only)' })
  @ApiResponse({ status: 200, description: 'Team fair-play points updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid fair-play points' })
  @ApiResponse({ status: 403, description: 'Administrator role required' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  async updateTeamFairPlay(
    @Param('teamId') teamId: string,
    @Body() body: { fairPlay: number },
    @Req() req: Request,
  ) {
    const user = req.user as any;
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only administrators can update team fair-play points');
    }
    return this.matchService.updateTeamFairPlay(teamId, body.fairPlay);
  }

  @Post(':matchId/predict')
  @ApiOperation({ summary: 'Submit a prediction for a match' })
  @ApiResponse({ status: 200, description: 'Prediction submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid prediction or deadline passed' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async submitPrediction(
    @Param('poolId') poolId: string,
    @Param('matchId') matchId: string,
    @Body() body: { homeScore: number | null; awayScore: number | null },
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.matchService.submitPrediction(
      poolId,
      matchId,
      user.userId,
      body.homeScore,
      body.awayScore,
    );
  }

  @Get('predictions')
  @ApiOperation({ summary: 'Get user predictions for a pool' })
  @ApiResponse({ status: 200, description: 'List of user predictions' })
  async getUserPredictions(@Param('poolId') poolId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.matchService.getUserPredictions(poolId, user.userId);
  }

  @Get('insights/:matchType/:matchId')
  @ApiOperation({ summary: 'Get all member picks and selected-player actions for a locked match' })
  @ApiResponse({ status: 200, description: 'Match insights retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid match type' })
  @ApiResponse({ status: 403, description: 'Prediction deadline has not passed or membership required' })
  @ApiResponse({ status: 404, description: 'Pool or match not found' })
  async getMatchInsights(
    @Param('poolId') poolId: string,
    @Param('matchType') matchType: 'group' | 'final',
    @Param('matchId') matchId: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.matchService.getMatchInsights(
      poolId,
      matchType,
      matchId,
      user.userId,
      user.role,
    );
  }

  @Post(':matchId/results')
  @ApiOperation({ summary: 'Update match results (Admin only)' })
  @ApiResponse({ status: 200, description: 'Match results updated and predictions evaluated' })
  @ApiResponse({ status: 400, description: 'Invalid results' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async updateMatchResults(
    @Param('poolId') poolId: string,
    @Param('matchId') matchId: string,
    @Body() body: { homeResult: number | null; awayResult: number | null; winnerPoints?: number; exactResultPoints?: number },
    @Req() req: Request,
  ) {
    const user = req.user as any;
    // Check if user is admin
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only administrators can update match results');
    }

    return this.matchService.updateMatchResults(matchId, body.homeResult, body.awayResult);
  }

  @Get('ranking')
  @ApiOperation({ summary: 'Get pool ranking by points' })
  @ApiResponse({ status: 200, description: 'Pool ranking' })
  async getPoolRanking(@Param('poolId') poolId: string) {
    return this.matchService.getPoolRanking(poolId);
  }
}
