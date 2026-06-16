import { Router } from 'express';
import { container } from '../../container';
import { validateBody, validateQuery } from '../middlewares/validateRequest';
import { requireRoles } from '../middlewares/authMiddleware';
import { Role } from '../../domain/enums';
import {
  loginSchema,
  refreshTokenSchema,
  googleTokenSchema,
  createCompanySchema,
  updateCompanySchema,
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  createLabelSchema,
  updateLabelSchema,
  bulkCreateLabelsSchema,
  labelFiltersSchema,
} from '../../application/dto';

const router = Router();
const { authController, companyController, userController, labelController, authMiddleware } =
  container;

router.post('/auth/login', validateBody(loginSchema), authController.login);
router.post('/auth/refresh', validateBody(refreshTokenSchema), authController.refresh);
router.get('/auth/me', authMiddleware, authController.me);
router.post('/auth/logout', authMiddleware, validateBody(refreshTokenSchema), authController.logout);
router.post('/auth/google', validateBody(googleTokenSchema), authController.googleLogin);
router.get('/auth/google', authController.googleAuth);
router.get('/auth/google/callback', authController.googleCallback);

router.get('/dashboard', authMiddleware, labelController.getDashboard);

router.get(
  '/companies',
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN),
  companyController.findAll,
);
router.get(
  '/companies/me',
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ASESOR),
  companyController.me,
);
router.get(
  '/companies/:id',
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN),
  companyController.findById,
);
router.post(
  '/companies',
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN),
  validateBody(createCompanySchema),
  companyController.create,
);
router.put(
  '/companies/:id',
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN),
  validateBody(updateCompanySchema),
  companyController.update,
);
router.patch(
  '/companies/:id/deactivate',
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN),
  companyController.deactivate,
);

router.get(
  '/users',
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN),
  userController.findAll,
);
router.get(
  '/users/:id',
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN),
  userController.findById,
);
router.post(
  '/users',
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN),
  validateBody(createUserSchema),
  userController.create,
);
router.put(
  '/users/:id',
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN),
  validateBody(updateUserSchema),
  userController.update,
);
router.patch(
  '/users/:id/reset-password',
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN),
  validateBody(resetPasswordSchema),
  userController.resetPassword,
);
router.patch(
  '/users/:id/deactivate',
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN),
  userController.deactivate,
);

router.get(
  '/labels',
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ASESOR),
  validateQuery(labelFiltersSchema),
  labelController.findAll,
);
router.get(
  '/labels/:id',
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ASESOR),
  labelController.findById,
);
router.get(
  '/labels/:id/detail',
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ASESOR),
  labelController.getDetail,
);
router.post(
  '/labels',
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ASESOR),
  validateBody(createLabelSchema),
  labelController.create,
);
router.post(
  '/labels/bulk',
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ASESOR),
  validateBody(bulkCreateLabelsSchema),
  labelController.bulkCreate,
);
router.put(
  '/labels/:id',
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ASESOR),
  validateBody(updateLabelSchema),
  labelController.update,
);
router.delete(
  '/labels/:id',
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ASESOR),
  labelController.delete,
);
router.post(
  '/labels/:id/duplicate',
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ASESOR),
  labelController.duplicate,
);
router.get(
  '/labels/:id/zpl',
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ASESOR),
  labelController.getZpl,
);
router.get(
  '/labels/:id/download',
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ASESOR),
  labelController.downloadZpl,
);
router.post(
  '/labels/preview',
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ASESOR),
  validateBody(createLabelSchema),
  labelController.preview,
);

export { router as apiRoutes };
