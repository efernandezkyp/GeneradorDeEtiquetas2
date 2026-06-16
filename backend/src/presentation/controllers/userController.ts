import { Request, Response } from 'express';
import { UserService } from '../../application/services/userService';
import { asyncHandler, sendSuccess } from '../middlewares/requestLogger';
import { getClientIp } from '../middlewares/authMiddleware';

export class UserController {
  constructor(private readonly userService: UserService) {}

  private getId(req: Request): string {
    return req.params.id as string;
  }

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const users = await this.userService.findAll(req.user!);
    sendSuccess(res, users);
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.findById(this.getId(req), req.user!);
    sendSuccess(res, user);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.create(req.body, req.user!, getClientIp(req));
    sendSuccess(res, user, 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.update(
      this.getId(req),
      req.body,
      req.user!,
      getClientIp(req),
    );
    sendSuccess(res, user);
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    await this.userService.resetPassword(
      this.getId(req),
      req.body.password,
      req.user!,
      getClientIp(req),
    );
    sendSuccess(res, { message: 'Contraseña actualizada correctamente' });
  });

  deactivate = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.deactivate(this.getId(req), req.user!, getClientIp(req));
    sendSuccess(res, user);
  });
}
