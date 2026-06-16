import { prisma } from '../prisma/client';
import {
  IUserRepository,
  CreateUserData,
  UpdateUserData,
} from '../../domain/interfaces';
import { UserEntity } from '../../domain/entities';
import { Role } from '../../domain/enums';

function mapUser(user: {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
  role: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): UserEntity {
  return {
    id: user.id,
    companyId: user.companyId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    passwordHash: user.passwordHash,
    googleId: user.googleId,
    role: user.role as Role,
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class PrismaUserRepository implements IUserRepository {
  async findAll(companyId?: string): Promise<UserEntity[]> {
    const users = await prisma.user.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { lastName: 'asc' },
    });
    return users.map(mapUser);
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? mapUser(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? mapUser(user) : null;
  }

  async findByGoogleId(googleId: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({ where: { googleId } });
    return user ? mapUser(user) : null;
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const user = await prisma.user.create({
      data: {
        companyId: data.companyId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash: data.password ?? null,
        googleId: data.googleId ?? null,
        role: data.role,
        active: data.active ?? true,
      },
    });
    return mapUser(user);
  }

  async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash: data.password,
        role: data.role,
        active: data.active,
        googleId: data.googleId,
      },
    });
    return mapUser(user);
  }

  async countActive(companyId?: string): Promise<number> {
    return prisma.user.count({
      where: {
        active: true,
        ...(companyId ? { companyId } : {}),
      },
    });
  }
}
