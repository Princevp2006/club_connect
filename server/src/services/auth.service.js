// ─── Auth Service ────────────────────────────────────────────────────────────
// Business logic for registration, login, and current-user lookup.
// ─────────────────────────────────────────────────────────────────────────────

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const userRepo = require('../repositories/user.repository');
const ApiError = require('../utils/apiError');
const { UserRole } = require('../types');

const SALT_ROUNDS = 10;

/**
 * Register a new student.
 * Public registration always creates a STUDENT role – never accept role from input.
 */
async function register({ fullName, email, password, studentId, phone }) {
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
