import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { SessionUserGuard } from '../../common/auth/session-user.guard';
import { SpyService } from './spy.service';

/**
 * Read-only endpoint that lets a pool member peek at another member's picks
 * across all three surfaces (group-phase predictions, bracket predictions,
 * and player selections). No mutations are exposed.
 */
@ApiTags('spy')
@Controller('pools/:poolId/members/:userId/picks')
@UseGuards(SessionUserGuard)
@ApiBearerAuth()
export class SpyController {
  constructor(private readonly spyService: SpyService) {}

  @Get()
  @ApiOperation({ summary: "Get another member's picks (read-only)" })
  @ApiResponse({ status: 200, description: 'Member picks retrieved' })
  @ApiResponse({ status: 403, description: 'Requester is not a member of the pool' })
  @ApiResponse({ status: 404, description: 'Pool or target member not found' })
  async getMemberPicks(
    @Param('poolId') poolId: string,
    @Param('userId') targetUserId: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.spyService.getMemberPicks(poolId, user.userId, user.role, targetUserId);
  }
}
