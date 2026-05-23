import { Router } from 'express';
import { UploadController } from '../controllers/UploadController';
import { validateFileUpload, validateUploadId } from '../utils/validation';
import { verifyToken } from '../middleware/auth';

const router = Router();

/**
 * POST /api/uploads
 * Create new file upload
 * Authenticated users only
 */
router.post('/', verifyToken, async (req, res, next) => {
  try {
    await UploadController.createUpload(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/uploads
 * List user's uploads
 * Authenticated users only
 */
router.get('/', verifyToken, async (req, res, next) => {
  try {
    await UploadController.listUploads(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/uploads/:uploadId
 * Delete an upload
 * Authenticated users only
 */
router.delete('/:uploadId', verifyToken, validateUploadId(), async (req, res, next) => {
  try {
    await UploadController.deleteUpload(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/uploads/:uploadId/check-quota
 * Check if adding upload would exceed quota
 */
router.get('/:uploadId/check-quota', validateUploadId(), async (req, res, next) => {
  try {
    await UploadController.checkQuota(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
