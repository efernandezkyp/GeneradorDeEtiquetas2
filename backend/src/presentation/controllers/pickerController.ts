import { Request, Response } from 'express';
import { PickerService } from '../../application/services/pickerService';
import { asyncHandler, sendSuccess } from '../middlewares/requestLogger';
import { getClientIp } from '../middlewares/authMiddleware';

export class PickerController {
  constructor(private readonly pickerService: PickerService) {}

  scan = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.pickerService.scanLabel(
      req.body.qrData,
      req.user!,
      getClientIp(req),
    );
    sendSuccess(res, result);
  });
}
