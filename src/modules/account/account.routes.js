const express = require('express');
const multer = require('multer');
const { z } = require('zod');
const { asyncHandler } = require('../../shared/errors');
const { validate } = require('../../shared/validation');
const { requireAuth } = require('../auth/auth.middleware');
const service = require('./account.service');

const accountRoutes = express.Router();
const avatarUpload = multer({ storage: multer.memoryStorage(), limits: { files: 1, fileSize: 5 * 1024 * 1024 } });
const profileSchema = z.object({ name: z.string().trim().min(2).max(120), phone: z.string().trim().max(40).optional().default(''), jobTitle: z.string().trim().max(120).optional().default('') });
const preferenceSchema = z.object({ language: z.literal('en').default('en'), timezone: z.string().trim().min(1).max(80), dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']), timeFormat: z.enum(['12h', '24h']) });
const passwordSchema = z.object({ currentPassword: z.string().min(1).max(72), newPassword: z.string().min(8).max(72), confirmPassword: z.string().min(8).max(72) }).refine((input) => input.newPassword === input.confirmPassword, { message: 'New passwords do not match', path: ['confirmPassword'] });

accountRoutes.use(requireAuth);
accountRoutes.get('/', asyncHandler(async (req, res) => res.json({ account: await service.getAccount(req.user.id) })));
accountRoutes.patch('/profile', asyncHandler(async (req, res) => res.json({ account: await service.updateProfile(req.user.id, validate(profileSchema, req.body)) })));
accountRoutes.put('/preferences', asyncHandler(async (req, res) => res.json({ account: await service.updatePreferences(req.user.id, validate(preferenceSchema, req.body)) })));
accountRoutes.get('/avatar', asyncHandler(async (req, res) => { const image = await service.avatar(req.user.id); res.set({ 'Content-Type': image.mime, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' }); res.send(image.buffer); }));
accountRoutes.post('/avatar', avatarUpload.single('avatar'), asyncHandler(async (req, res) => res.json({ account: await service.saveAvatar(req.user.id, req.file) })));
accountRoutes.delete('/avatar', asyncHandler(async (req, res) => { await service.removeAvatar(req.user.id); res.status(204).send(); }));
accountRoutes.post('/password', asyncHandler(async (req, res) => { await service.changePassword(req.user.id, validate(passwordSchema, req.body)); res.status(204).send(); }));

module.exports = { accountRoutes };
