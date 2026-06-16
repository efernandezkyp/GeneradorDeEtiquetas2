import { prisma } from '../prisma/client';
import { IRefreshTokenRepository } from '../../domain/interfaces';
import { RefreshTokenEntity } from '../../domain/entities';

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  async create(userId: string, token: string, expiresAt: Date): Promise<RefreshTokenEntity> {
    const refreshToken = await prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
    return refreshToken;
  }

  async findByToken(token: string): Promise<RefreshTokenEntity | null> {
    return prisma.refreshToken.findUnique({ where: { token } });
  }

  async deleteByToken(token: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }
}
