import { Router } from 'express';
import { DownloadController } from '../controllers/DownloadController';
import { validateUploadId, validateEmailShare } from '../utils/validation';
import { verifyToken } from '../middleware/auth';

const router = Router();

/**
 * GET /api/downloads/:uploadId
 * Get signed download URL for an upload
 * Public endpoint - no auth required
 */
router.get('/:uploadId', validateUploadId(), async (req, res, next) => {
  try {
    await DownloadController.getDownloadLink(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/downloads/:uploadId/qr
 * Get QR code for shareable download link
 */
router.get('/:uploadId/qr', validateUploadId(), async (req, res, next) => {
  try {
    await DownloadController.getQRCode(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/downloads/:uploadId/share
 * Share upload via email
 */
router.post('/:uploadId/share', validateEmailShare(), async (req, res, next) => {
  try {
    await DownloadController.shareViaEmail(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/downloads/:uploadId/page
 * Get public download page info
 */
router.get('/:uploadId/page', validateUploadId(), async (req, res, next) => {
  try {
    await DownloadController.getPublicDownloadPage(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
