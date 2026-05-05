import { Module } from '@nestjs/common';
import { PoolController } from './pool.controller';
import { PoolService } from './pool.service';
import { MatchModule } from './match/match.module';
import { BracketController } from './bracket/bracket.controller';
import { BracketService } from './bracket/bracket.service';
import { PoolRepository } from './database/pool.repository';
import { NotificationModule } from '../notification/notification.module';
import { PlayerController } from './player/player.controller';
import { PlayerService } from './player/player.service';
import { SpyController } from './spy/spy.controller';
import { SpyService } from './spy/spy.service';

@Module({
  controllers: [PoolController, BracketController, PlayerController, SpyController],
  providers: [PoolService, BracketService, PlayerService, SpyService, PoolRepository],
  imports: [MatchModule, NotificationModule],
  exports: [PoolService, PoolRepository],
})
export class PoolModule {}
