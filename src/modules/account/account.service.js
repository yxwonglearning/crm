const bcrypt = require('bcryptjs');
const { AppError } = require('../../shared/errors');
const repository = require('./account.repository');

function publicAccount(row) {
  if (!row) return null;
  return {
    id: Number(row.id), staffId: row.staff_id || '', name: row.name, email: row.email,
    role: row.role, status: row.status, organizationNodeId: row.organization_node_id ? Number(row.organization_node_id) : null,
    departmentName: row.department_name || 'Not assigned', phone: row.profile_phone || '', jobTitle: row.job_title || '',
    language: row.preferred_language || 'en', timezone: row.preferred_timezone || 'Asia/Singapore',
    dateFormat: row.preferred_date_format || 'DD/MM/YYYY', timeFormat: row.preferred_time_format || '24h',
    hasAvatar: Boolean(row.avatar_mime)
  };
}

async function getAccount(id) {
  const account = publicAccount(await repository.findAccount(id));
  if (!account) throw new AppError('Account not found', 404);
  return account;
}

async function avatar(id) {
  const row = await repository.findAccount(id, true);
  if (!row?.avatar_blob || !row.avatar_mime) throw new AppError('Profile photo not found', 404);
  return { buffer: row.avatar_blob, mime: row.avatar_mime };
}

function validImageSignature(buffer, mime) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;
  if (mime === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (mime === 'image/webp') return buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
  return false;
}

async function saveAvatar(id, file) {
  if (!file || !validImageSignature(file.buffer, file.mimetype)) throw new AppError('Choose a valid JPG, PNG, or WebP image', 422);
  await repository.saveAvatar(id, file.buffer, file.mimetype);
  return getAccount(id);
}

async function changePassword(id, input) {
  const credentials = await repository.credentials(id);
  if (!credentials?.password_hash || !await bcrypt.compare(input.currentPassword, credentials.password_hash)) throw new AppError('Current password is incorrect', 422);
  if (await bcrypt.compare(input.newPassword, credentials.password_hash)) throw new AppError('New password must be different from the current password', 422);
  await repository.changePassword(id, await bcrypt.hash(input.newPassword, 12));
}

module.exports = {
  getAccount,
  updateProfile: async (id, input) => publicAccount(await repository.updateProfile(id, input)),
  updatePreferences: async (id, input) => publicAccount(await repository.updatePreferences(id, input)),
  avatar,
  saveAvatar,
  removeAvatar: async (id) => { await repository.removeAvatar(id); },
  changePassword
};
