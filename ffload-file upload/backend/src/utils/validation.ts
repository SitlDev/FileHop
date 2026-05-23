import { body, param, query, ValidationChain } from 'express-validator';

export const validateRegister = (): ValidationChain[] => [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().notEmpty(),
];

export const validateLogin = (): ValidationChain[] => [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

export const validateFileUpload = (): ValidationChain[] => [
  body('filename').trim().notEmpty(),
  body('fileSizeBytes').isInt({ min: 1 }),
  body('mimeType').notEmpty(),
  body('fileHash').isLength({ min: 64, max: 64 }), // SHA-256
];

export const validatePaymentIntent = (): ValidationChain[] => [
  body('paymentType').isIn(['one_time', 'subscription']),
];

export const validateUploadId = (): ValidationChain[] => [
  param('uploadId').isLength({ min: 1 }),
];

export const validateUserId = (): ValidationChain[] => [
  param('userId').isLength({ min: 1 }),
];

export const validateEmailShare = (): ValidationChain[] => [
  param('uploadId').isLength({ min: 1 }),
  body('recipientEmail').isEmail().normalizeEmail(),
];
