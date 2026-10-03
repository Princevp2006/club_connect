// ─── Test Setup ──────────────────────────────────────────────────────────────
// Load environment variables before anything else.
require('dotenv').config();

// Override to test environment
process.env.NODE_ENV = 'test';
