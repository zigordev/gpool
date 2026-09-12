interface Pool {
  poolId: string;
  name: string;
  description?: string;
  adminUserId: string;
  adminName?: string;
  adminEmail?: string;
  memberCount?: number;
  createdAt: number;
  isMember?: boolean;
  userMembership?: any;
  config: any;
}