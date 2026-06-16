import { prisma } from '../prisma/client';
import {
  ICompanyRepository,
  CreateCompanyData,
  UpdateCompanyData,
} from '../../domain/interfaces';
import { CompanyEntity } from '../../domain/entities';

function mapCompany(company: {
  id: string;
  name: string;
  code: string;
  defaultOriginCompany: string;
  defaultDestinationCompany: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): CompanyEntity {
  return {
    id: company.id,
    name: company.name,
    code: company.code,
    defaultOriginCompany: company.defaultOriginCompany,
    defaultDestinationCompany: company.defaultDestinationCompany,
    active: company.active,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  };
}

export class PrismaCompanyRepository implements ICompanyRepository {
  async findAll(): Promise<CompanyEntity[]> {
    const companies = await prisma.company.findMany({ orderBy: { name: 'asc' } });
    return companies.map(mapCompany);
  }

  async findById(id: string): Promise<CompanyEntity | null> {
    const company = await prisma.company.findUnique({ where: { id } });
    return company ? mapCompany(company) : null;
  }

  async findByCode(code: string): Promise<CompanyEntity | null> {
    const company = await prisma.company.findUnique({ where: { code } });
    return company ? mapCompany(company) : null;
  }

  async create(data: CreateCompanyData): Promise<CompanyEntity> {
    const company = await prisma.company.create({ data });
    return mapCompany(company);
  }

  async update(id: string, data: UpdateCompanyData): Promise<CompanyEntity> {
    const company = await prisma.company.update({ where: { id }, data });
    return mapCompany(company);
  }

  async countActive(): Promise<number> {
    return prisma.company.count({ where: { active: true } });
  }
}
