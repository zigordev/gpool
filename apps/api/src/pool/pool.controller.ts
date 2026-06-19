import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PoolService } from './pool.service';
import { CreatePoolDto } from './dto/create-pool.dto';
import { UpdatePoolDto } from './dto/update-pool.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { SessionUserGuard } from '../common/auth/session-user.guard';
import { Request } from 'express';

@ApiTags('pools')
@Controller('pools')
@UseGuards(SessionUserGuard)
@ApiBearerAuth()
export class PoolController {
  constructor(private readonly poolService: PoolService) {}

  @Post()
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new pool (Admin only)' })
  @ApiResponse({ status: 201, description: 'Pool created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async createPool(@Body() createPoolDto: CreatePoolDto, @Req() req: Request) {
    const user = req.user as any;
    return this.poolService.createPool(createPoolDto, user.userId, user.role, user.name, user.email);
  }

  @Get()
  @ApiOperation({ summary: 'List all pools' })
  @ApiResponse({ status: 200, description: 'List of pools' })
  async listPools(@Req() req?: Request) {
    const user = req?.user as any;
    return this.poolService.listPools({
      userId: user?.userId,
    });
  }

  @Get(':poolId')
  @ApiOperation({ summary: 'Get pool details' })
  @ApiResponse({ status: 200, description: 'Pool details' })
  @ApiResponse({ status: 404, description: 'Pool not found' })
  async getPool(@Param('poolId') poolId: string, @Req() req?: Request) {
    const user = req?.user as any;
    return this.poolService.getPool(poolId, user?.userId);
  }

  @Put(':poolId')
  @ApiOperation({ summary: 'Update pool (pool membership admin only)' })
  @ApiResponse({ status: 200, description: 'Pool updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Pool not found' })
  async updatePool(
    @Param('poolId') poolId: string,
    @Body() updatePoolDto: UpdatePoolDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.poolService.updatePool(poolId, updatePoolDto, user.userId, user.role);
  }

  @Delete(':poolId')
  @ApiOperation({ summary: 'Delete pool (pool membership admin only)' })
  @ApiResponse({ status: 200, description: 'Pool deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Pool not found' })
  async deletePool(@Param('poolId') poolId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.poolService.deletePool(poolId, user.userId, user.role);
  }

  @Post(':poolId/request-access')
  @ApiOperation({ summary: 'Request access to a pool' })
  @ApiResponse({ status: 200, description: 'Access requested successfully' })
  @ApiResponse({ status: 400, description: 'Already a member' })
  @ApiResponse({ status: 404, description: 'Pool not found' })
  async requestAccess(@Param('poolId') poolId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.poolService.requestAccess(poolId, user.userId, user.email, user.name);
  }

  @Post(':poolId/accept-request/:userId')
  @ApiOperation({ summary: 'Accept access request (pool membership admin only)' })
  @ApiResponse({ status: 200, description: 'Access granted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Pool not found' })
  async acceptAccessRequest(
    @Param('poolId') poolId: string,
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.poolService.acceptAccessRequest(poolId, userId, user.userId, user.role);
  }

  @Post(':poolId/invite')
  @ApiOperation({ summary: 'Invite user to pool (pool membership admin only)' })
  @ApiResponse({ status: 200, description: 'Invitation sent successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Pool not found' })
  async inviteUser(
    @Param('poolId') poolId: string,
    @Body() inviteUserDto: InviteUserDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.poolService.inviteUser(poolId, inviteUserDto.email, user.userId, user.role, user.email);
  }

  @Post(':poolId/accept-invitation')
  @ApiOperation({ summary: 'Accept invitation to join a pool' })
  @ApiResponse({ status: 200, description: 'Invitation accepted successfully' })
  @ApiResponse({ status: 404, description: 'Pool not found' })
  async acceptInvitation(@Param('poolId') poolId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.poolService.acceptInvitation(poolId, user.userId, user.email, user.name);
  }

  @Put(':poolId/configuration')
  @ApiOperation({ summary: 'Update pool configuration (pool membership admin only)' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Pool not found' })
  async updatePoolConfiguration(
    @Param('poolId') poolId: string,
    @Body() newConfig: Record<string, any>,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.poolService.updatePoolConfiguration(poolId, newConfig, user.userId, user.role);
  }
}
