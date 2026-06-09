import { Body, Controller, ForbiddenException, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { SessionUserGuard } from '../../common/auth/session-user.guard';
import {
  PlayerAward,
  PlayerMatchType,
  PlayerPosition,
  PlayerService,
  PlayerStatKey,
} from './player.service';

@ApiTags('players')
@Controller('pools/:poolId/players')
@UseGuards(SessionUserGuard)
@ApiBearerAuth()
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Get()
  @ApiOperation({ summary: 'Get tournament players and current user selections for a pool' })
  @ApiResponse({ status: 200, description: 'Player selection state retrieved successfully' })
  async getPlayers(@Param('poolId') poolId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.playerService.getPlayerSelectionState(poolId, user.userId);
  }

  @Get('selection-statistics')
  @ApiOperation({ summary: 'Get locked player selection popularity statistics for a pool' })
  @ApiResponse({ status: 200, description: 'Player selection statistics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Prediction deadline has not passed or membership required' })
  async getSelectionStatistics(@Param('poolId') poolId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.playerService.getPlayerSelectionStatistics(
      poolId,
      user.userId,
      user.role,
    );
  }

  @Put('selection')
  @ApiOperation({ summary: 'Create, update, or clear one player selection slot' })
  @ApiResponse({ status: 200, description: 'Selection updated successfully' })
  async updateSelection(
    @Param('poolId') poolId: string,
    @Body() body: { position: PlayerPosition; slot: number; playerId?: string | null },
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.playerService.updatePlayerSelection(
      poolId,
      user.userId,
      body.position,
      body.slot,
      body.playerId || null,
    );
  }

  @Put('award-selection')
  @ApiOperation({ summary: 'Create, update, or clear one player award selection' })
  @ApiResponse({ status: 200, description: 'Award selection updated successfully' })
  async updateAwardSelection(
    @Param('poolId') poolId: string,
    @Body() body: { award: PlayerAward; playerId?: string | null },
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.playerService.updatePlayerAwardSelection(
      poolId,
      user.userId,
      body.award,
      body.playerId || null,
    );
  }

  @Put('award-result')
  @ApiOperation({ summary: 'Select or clear a real tournament player award (Admin only)' })
  @ApiResponse({ status: 200, description: 'Tournament award result updated successfully' })
  async updateAwardResult(
    @Body() body: { award: PlayerAward; playerId: string; selected: boolean },
    @Req() req: Request,
  ) {
    const user = req.user as any;
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only administrators can update tournament awards');
    }
    return this.playerService.updateTournamentPlayerAward(
      body.playerId,
      body.award,
      body.selected,
      user.role,
    );
  }

  @Put(':playerId/stats')
  @ApiOperation({ summary: 'Update tournament player stats (Admin only)' })
  @ApiResponse({ status: 200, description: 'Player stats updated successfully' })
  async updatePlayerStats(
    @Param('poolId') poolId: string,
    @Param('playerId') playerId: string,
    @Body() body: {
      matchId: string;
      matchType: PlayerMatchType;
      stat: PlayerStatKey;
      delta: number;
    },
    @Req() req: Request,
  ) {
    const user = req.user as any;
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only administrators can update player stats');
    }
    return this.playerService.updatePlayerStats(poolId, playerId, body, user.role);
  }
}
