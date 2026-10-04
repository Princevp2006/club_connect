// ─── Auth Service ────────────────────────────────────────────────────────────
// Business logic for registration, login, and current-user lookup.
// ─────────────────────────────────────────────────────────────────────────────

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const userRepo = require('../repositories/user.repository');
const membershipRepo = require('../repositories/membership.repository');
const { deriveStatus } = require('./membership.service');
const ApiError = require('../utils/apiError');
const { UserRole, MembershipStatus } = require('../types');

const SALT_ROUNDS = 10;

/**
 * Register a new student.
 * Public registration always creates a STUDENT role – never accept role from input.
 * Membership is created separately via the subscription flow.
 */
async function register({ fullName, email, password, studentId, phone, collegeName, year }) {
  // Check duplicate email
  const existingEmail = await userRepo.findByEmail(email);
  if (existingEmail) {
    throw ApiError.conflict('Email is already registered');
  }

  // Check duplicate studentId
  if (studentId) {
    const existingStudentId = await userRepo.findByStudentId(studentId);
    if (existingStudentId) {
      throw ApiError.conflict('Student ID is already registered');
    }
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await userRepo.create({
    fullName,
    email,
    passwordHash,
    role: UserRole.STUDENT, // Always STUDENT via public registration
    studentId: studentId || null,
    phone: phone || null,
    collegeName: collegeName || null,
    year: year || null,
    isActive: true,
  });

  return user;
}

/**
 * Authenticate a user and return a JWT + safe user object.
 */
async function login({ email, password }) {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.unauthorized('Account is deactivated. Please contact an administrator.');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Student membership enforcement:
  // If user is a STUDENT, verify they hold an active valid membership.
  // Inactive, expired, or cancelled memberships block normal login.
  if (user.role === UserRole.STUDENT) {
    const memberships = await membershipRepo.findByUserId(user.id);
    const hasActive = memberships.some((m) => deriveStatus(m) === MembershipStatus.ACTIVE);

    if (!hasActive) {
      // Create a restricted pre-membership session token so the student
      // can complete the simulated membership subscription flow.
      const tempToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          isPreMembership: true,
        },
        config.jwt.secret,
        { expiresIn: '30m' }
      );

      const err = ApiError.forbidden(
        'Active membership required. Your membership is cancelled or expired. Please purchase or renew a membership.'
      );
      err.code = 'MEMBERSHIP_REQUIRED';
      err.errors = {
        code: 'MEMBERSHIP_REQUIRED',
        requiresMembership: true,
        tempToken,
        userId: user.id,
        email: user.email,
      };
      throw err;
    }
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  // Return user without passwordHash
  const { passwordHash: _, ...safeUser } = user;

  return { token, user: safeUser };
}

/**
 * Get the current authenticated user's profile.
 */
async function getCurrentUser(userId) {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
}

module.exports = { register, login, getCurrentUser };

