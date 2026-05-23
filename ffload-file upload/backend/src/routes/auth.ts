import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateRegister, validateLogin } from '../utils/validation';
import { verifyToken } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user with email/password
 */
router.post('/register', validateRegister(), async (req, res, next) => {
  try {
    await AuthController.register(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login user with email/password
 */
router.post('/login', validateLogin(), async (req, res, next) => {
  try {
    await AuthController.login(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout user (frontend should delete token)
 */
router.post('/logout', verifyToken, async (req, res, next) => {
  try {
    await AuthController.logout(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/google
 * Handle Google OAuth callback
 */
router.post('/google', async (req, res, next) => {
  try {
    await AuthController.googleCallback(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
