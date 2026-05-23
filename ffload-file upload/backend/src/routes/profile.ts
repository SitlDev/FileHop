import { Router } from 'express';
import { ProfileController } from '../controllers/ProfileController';
import { verifyToken } from '../middleware/auth';

const router = Router();

/**
 * GET /api/profile
 * Get authenticated user's profile
 */
router.get('/', verifyToken, async (req, res, next) => {
  try {
    await ProfileController.getProfile(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/profile
 * Update authenticated user's profile
 */
router.put('/', verifyToken, async (req, res, next) => {
  try {
    await ProfileController.updateProfile(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/profile/storage
 * Get user's storage information and file breakdown
 */
router.get('/storage', verifyToken, async (req, res, next) => {
  try {
    await ProfileController.getStorageInfo(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
