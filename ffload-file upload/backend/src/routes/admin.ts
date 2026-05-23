import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { verifyToken, verifyAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role

/**
 * GET /api/admin/dashboard
 * Get admin dashboard statistics
 */
router.get('/dashboard', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    await AdminController.getDashboard(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users
 * List all users with optional search
 * Query params: search, page, limit
 */
router.get('/users', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    await AdminController.listUsers(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/uploads
 * Search uploads by filename, userId, or size
 * Query params: filename, userId, minSize, maxSize, page, limit
 */
router.get('/uploads', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    await AdminController.searchUploads(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Delete a user and all their data
 */
router.delete('/users/:userId', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    await AdminController.deleteUserData(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
