import { Request, Response } from 'express';
import { CompanyService } from '../../application/services/companyService';
import { asyncHandler, sendSuccess } from '../middlewares/requestLogger';
import { getClientIp } from '../middlewares/authMiddleware';

export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  private getId(req: Request): string {
    return req.params.id as string;
  }

  me = asyncHandler(async (req: Request, res: Response) => {
    const company = await this.companyService.getMyCompany(req.user!);
    sendSuccess(res, company);
  });

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const companies = await this.companyService.findAll(req.user!);
    sendSuccess(res, companies);
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const company = await this.companyService.findById(this.getId(req), req.user!);
    sendSuccess(res, company);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const company = await this.companyService.create(req.body, req.user!, getClientIp(req));
    sendSuccess(res, company, 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const company = await this.companyService.update(
      this.getId(req),
      req.body,
      req.user!,
      getClientIp(req),
    );
    sendSuccess(res, company);
  });

  deactivate = asyncHandler(async (req: Request, res: Response) => {
    const company = await this.companyService.deactivate(
      this.getId(req),
      req.user!,
      getClientIp(req),
    );
    sendSuccess(res, company);
  });
}
