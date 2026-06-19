import { Request, Response } from 'express';
import { LabelService } from '../../application/services/labelService';
import { DashboardService } from '../../application/services/tenantGuard';
import { asyncHandler, sendSuccess } from '../middlewares/requestLogger';
import { getClientIp } from '../middlewares/authMiddleware';

export class LabelController {
  constructor(
    private readonly labelService: LabelService,
    private readonly dashboardService: DashboardService,
  ) {}

  private getId(req: Request): string {
    return req.params.id as string;
  }

  getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.dashboardService.getStats(req.user!);
    sendSuccess(res, stats);
  });

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const validatedQuery = (req as Request & { validatedQuery?: unknown }).validatedQuery;
    const result = await this.labelService.findAll((validatedQuery ?? req.query) as never, req.user!);
    sendSuccess(res, result);
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const label = await this.labelService.findById(this.getId(req), req.user!);
    sendSuccess(res, label);
  });

  getDetail = asyncHandler(async (req: Request, res: Response) => {
    const detail = await this.labelService.getDetail(this.getId(req), req.user!);
    sendSuccess(res, detail);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const label = await this.labelService.create(req.body, req.user!, getClientIp(req));
    sendSuccess(res, label, 201);
  });

  bulkCreate = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.labelService.bulkCreate(req.body.labels, req.user!, getClientIp(req));
    sendSuccess(res, result, 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const label = await this.labelService.update(
      this.getId(req),
      req.body,
      req.user!,
      getClientIp(req),
    );
    sendSuccess(res, label);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await this.labelService.delete(this.getId(req), req.user!, getClientIp(req));
    sendSuccess(res, { message: 'Etiqueta eliminada correctamente' });
  });

  duplicate = asyncHandler(async (req: Request, res: Response) => {
    const label = await this.labelService.duplicate(this.getId(req), req.user!, getClientIp(req));
    sendSuccess(res, label, 201);
  });

  getZpl = asyncHandler(async (req: Request, res: Response) => {
    const zpl = await this.labelService.getZpl(this.getId(req), req.user!);
    sendSuccess(res, { zpl });
  });

  downloadZpl = asyncHandler(async (req: Request, res: Response) => {
    const downloadType = req.query.bulk === 'true' ? 'bulk' : 'single';
    const result = await this.labelService.downloadZpl(
      this.getId(req),
      req.user!,
      getClientIp(req),
      downloadType,
    );
    sendSuccess(res, result);
  });

  preview = asyncHandler(async (req: Request, res: Response) => {
    const zpl = await this.labelService.preview(req.body, req.user!);
    sendSuccess(res, { zpl });
  });
}
