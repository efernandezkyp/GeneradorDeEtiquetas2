import { Request, Response } from 'express';
import { AuthService } from '../../application/services/authService';
import { asyncHandler, sendSuccess } from '../middlewares/requestLogger';
import { getClientIp } from '../middlewares/authMiddleware';
import { config } from '../../config';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.login(req.body, getClientIp(req));
    sendSuccess(res, result);
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.refresh(req.body.refreshToken);
    sendSuccess(res, result);
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.authService.getCurrentUser(req.user!);
    sendSuccess(res, user);
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    await this.authService.logout(req.body.refreshToken, req.user!, getClientIp(req));
    sendSuccess(res, { message: 'Sesión cerrada correctamente' });
  });

  googleAuth = asyncHandler(async (_req: Request, res: Response) => {
    const url = this.authService.getGoogleAuthUrl();
    res.redirect(url);
  });

  googleCallback = asyncHandler(async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const result = await this.authService.handleGoogleCallback(code, getClientIp(req));
    const params = new URLSearchParams({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    res.redirect(`${config.frontendUrl}/auth/callback?${params.toString()}`);
  });

  googleLogin = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.loginWithGoogle(req.body.idToken, getClientIp(req));
    sendSuccess(res, result);
  });
}
