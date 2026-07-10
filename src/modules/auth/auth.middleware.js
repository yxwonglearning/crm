const jwt = require('jsonwebtoken');
const { createClerkClient, verifyToken } = require('@clerk/backend');
const { config } = require('../../shared/config');
const { AppError } = require('../../shared/errors');
const { findUserByClerkId, findUserByEmail, findUserById, updateUserClerkId } = require('./auth.repository');

const clerkClient = config.clerk.secretKey && config.clerk.publishableKey
  ? createClerkClient({
    secretKey: config.clerk.secretKey,
    publishableKey: config.clerk.publishableKey
  })
  : null;

function tokenFromRequest(req) {
  const header = req.headers.authorization || '';
  const bearerToken = header.startsWith('Bearer ') ? header.slice(7) : null;
  const cookieToken = String(req.headers.cookie || '')
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith('__session='))
    ?.slice('__session='.length);
  return bearerToken || cookieToken || null;
}

async function authenticateLocalToken(token) {
  const decoded = jwt.verify(token, config.jwtSecret, {
    algorithms: ['HS256'],
    audience: config.jwtAudience,
    issuer: config.jwtIssuer
  });
  const userId = decoded.sub || decoded.id;
  const user = userId ? await findUserById(userId) : null;
  if (!user || user.status !== 'active') {
    throw new AppError('Invalid or expired token', 401);
  }
  return user;
}

async function clerkPrimaryEmail(clerkUserId) {
  if (!clerkClient) return '';
  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const primaryEmailId = clerkUser.primaryEmailAddressId;
  return clerkUser.emailAddresses.find((email) => email.id === primaryEmailId)?.emailAddress
    || clerkUser.emailAddresses[0]?.emailAddress
    || '';
}

async function authenticateClerkToken(token) {
  if (!config.clerk.publishableKey || (!config.clerk.jwtKey && !config.clerk.secretKey)) {
    throw new AppError('Clerk authentication is not configured', 503);
  }

  const verifiedToken = await verifyToken(token, {
    authorizedParties: config.clerk.authorizedParties,
    jwtKey: config.clerk.jwtKey || undefined,
    secretKey: config.clerk.secretKey || undefined
  });
  const clerkUserId = verifiedToken.sub;
  let user = clerkUserId ? await findUserByClerkId(clerkUserId) : null;

  if (!user && config.clerk.autoLinkByEmail) {
    const email = await clerkPrimaryEmail(clerkUserId);
    const localUser = email ? await findUserByEmail(email) : null;
    if (localUser && !localUser.clerk_user_id) {
      await updateUserClerkId(localUser.id, clerkUserId);
      user = await findUserByClerkId(clerkUserId);
    }
  }

  if (!user || user.status !== 'active') {
    throw new AppError('No active CRM user is mapped to this Clerk account', 403);
  }
  return user;
}

function requireAuth(req, _res, next) {
  const token = tokenFromRequest(req);
  if (!token) {
    next(new AppError('Authentication required', 401));
    return;
  }

  Promise.resolve()
    .then(async () => {
      const user = config.authProvider === 'clerk'
        ? await authenticateClerkToken(token)
        : await authenticateLocalToken(token);
      req.user = user;
      next();
    })
    .catch((error) => {
      next(error instanceof AppError ? error : new AppError('Invalid or expired token', 401));
    });
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new AppError('You do not have permission to perform this action', 403));
      return;
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
