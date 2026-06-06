import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

class ScoringRulesDto {
    @ApiProperty({ description: 'Points for exact score match', example: 10 })
    @IsOptional()
    exactScore?: number;

    @ApiProperty({ description: 'Points for correct result (win/draw/loss)', example: 5 })
    @IsOptional()
    correctResult?: number;

    @ApiProperty({ description: 'Points for correct home score', example: 2 })
    @IsOptional()
    correctHomeScore?: number;

    @ApiProperty({ description: 'Points for correct away score', example: 2 })
    @IsOptional()
    correctAwayScore?: number;
}

class MatchSelectionDto {
    @ApiPropertyOptional({ description: 'Competition name', example: 'Premier League' })
    @IsOptional()
    @IsString()
    competition?: string;

    @ApiPropertyOptional({ description: 'Season', example: '2024-2025' })
    @IsOptional()
    @IsString()
    season?: string;
}

class PoolSettingsDto {
    @ApiProperty({ description: 'Is pool public (anyone can join)', example: false })
    @IsOptional()
    isPublic?: boolean;

    @ApiProperty({ description: 'Is pool invite-only', example: true })
    @IsOptional()
    inviteOnly?: boolean;

    @ApiProperty({ description: 'Maximum number of members', example: 50 })
    @IsOptional()
    maxMembers?: number;

}

class PrizePayoutDto {
    @ApiProperty({ description: 'Ranking position that receives a prize', example: 1 })
    @IsInt()
    @Min(1)
    rank: number;

    @ApiProperty({ description: 'Percentage of the prize pool paid to this ranking position', example: 50 })
    @IsNumber()
    @Min(0)
    @Max(100)
    percentage: number;
}

class PrizeDistributionDto {
    @ApiProperty({ description: 'Number of ranking positions that receive a prize', example: 3 })
    @IsInt()
    @Min(0)
    paidPositions: number;

    @ApiProperty({ type: [PrizePayoutDto], description: 'Prize payout percentages by ranking position' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PrizePayoutDto)
    payouts: PrizePayoutDto[];
}

class PlayerGoalScoringDto {
    @ApiProperty({ description: 'Goal points for goalkeepers', example: 10 })
    @IsNumber()
    goalkeeper: number;

    @ApiProperty({ description: 'Goal points for defenders', example: 6 })
    @IsNumber()
    defender: number;

    @ApiProperty({ description: 'Goal points for midfielders', example: 4 })
    @IsNumber()
    midfielder: number;

    @ApiProperty({ description: 'Goal points for forwards', example: 3 })
    @IsNumber()
    forward: number;
}

class PlayerAwardScoringDto {
    @ApiProperty({ description: 'Points for predicting the Golden Boot winner', example: 15 })
    @IsNumber()
    @Min(0)
    goldenBoot: number;

    @ApiProperty({ description: 'Points for predicting the tournament MVP', example: 15 })
    @IsNumber()
    @Min(0)
    tournamentMvp: number;
}

class PlayerScoringDto {
    @ApiProperty({ type: PlayerGoalScoringDto, description: 'Goal points by player position' })
    @IsObject()
    @ValidateNested()
    @Type(() => PlayerGoalScoringDto)
    goal: PlayerGoalScoringDto;

    @ApiProperty({ description: 'Points for a missed penalty', example: -2 })
    @IsNumber()
    missedPenalty: number;

    @ApiProperty({ description: 'Points for MVP', example: 5 })
    @IsNumber()
    mvp: number;

    @ApiProperty({ description: 'Points for a penalty save', example: 5 })
    @IsNumber()
    penaltySaved: number;

    @ApiProperty({ type: PlayerGoalScoringDto, description: 'Clean-sheet points by player position' })
    @IsObject()
    @ValidateNested()
    @Type(() => PlayerGoalScoringDto)
    cleanSheet: PlayerGoalScoringDto;

    @ApiProperty({ type: PlayerAwardScoringDto, description: 'Special award prediction points' })
    @IsObject()
    @ValidateNested()
    @Type(() => PlayerAwardScoringDto)
    award: PlayerAwardScoringDto;
}

class PlayerAwardWinnersDto {
    @ApiPropertyOptional({
      description: 'Player IDs for the Golden Boot winners. Multiple players are allowed.',
      type: [String],
      example: ['argentina-forward-1', 'france-forward-1'],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    goldenBootPlayerIds?: string[];

    @ApiPropertyOptional({
      description: 'Player ID for the tournament MVP. Only one player is allowed.',
      example: 'argentina-midfielder-1',
    })
    @IsOptional()
    @IsString()
    tournamentMvpPlayerId?: string;
}

class PlayerSelectionLimitsDto {
    @ApiProperty({ description: 'Number of goalkeepers each member selects', example: 6 })
    @IsInt()
    @Min(1)
    @Max(12)
    goalkeeper: number;

    @ApiProperty({ description: 'Number of defenders each member selects', example: 6 })
    @IsInt()
    @Min(1)
    @Max(12)
    defender: number;

    @ApiProperty({ description: 'Number of midfielders each member selects', example: 6 })
    @IsInt()
    @Min(1)
    @Max(12)
    midfielder: number;

    @ApiProperty({ description: 'Number of forwards each member selects', example: 6 })
    @IsInt()
    @Min(1)
    @Max(12)
    forward: number;
}

export class PoolConfigDto {
    @ApiPropertyOptional({ type: ScoringRulesDto, description: 'Scoring rules' })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => ScoringRulesDto)
    scoring?: ScoringRulesDto;

    @ApiPropertyOptional({ type: MatchSelectionDto, description: 'Match selection criteria' })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => MatchSelectionDto)
    matchSelection?: MatchSelectionDto;

    @ApiPropertyOptional({ type: PoolSettingsDto, description: 'Pool settings' })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => PoolSettingsDto)
    settings?: PoolSettingsDto;

    @ApiPropertyOptional({
      description: 'Pool-wide prediction deadline (epoch milliseconds). Once passed, no predictions or bracket picks can be made or edited.',
      example: 1749340800000,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    deadline?: number;

    @ApiPropertyOptional({
      description: 'Required entry price (e.g. in EUR) to participate in the pool.',
      example: 10,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    entryFee?: number;

    @ApiPropertyOptional({
      type: PrizeDistributionDto,
      description: 'Prize distribution percentages by ranking position.',
    })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => PrizeDistributionDto)
    prizeDistribution?: PrizeDistributionDto;

    @ApiPropertyOptional({
      type: PlayerScoringDto,
      description: 'Player action scoring rules.',
    })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => PlayerScoringDto)
    playerScoring?: PlayerScoringDto;

    @ApiPropertyOptional({
      type: PlayerAwardWinnersDto,
      description: 'Configured tournament award winners used to score special player picks.',
    })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => PlayerAwardWinnersDto)
    playerAwardWinners?: PlayerAwardWinnersDto;

    @ApiPropertyOptional({
      type: PlayerSelectionLimitsDto,
      description: 'Number of player selections required for each position.',
    })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => PlayerSelectionLimitsDto)
    playerSelectionLimits?: PlayerSelectionLimitsDto;
}

export class CreatePoolDto {
    @ApiProperty({ description: 'Pool name', example: 'Premier League 2024', minLength: 3, maxLength: 100 })
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(100)
    name: string;

    @ApiPropertyOptional({ description: 'Pool description', example: 'Season-long pool for Premier League', maxLength: 500 })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @ApiPropertyOptional({ type: PoolConfigDto, description: 'Pool configuration' })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => PoolConfigDto)
    config?: PoolConfigDto;
}
