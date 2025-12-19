/**
 * Jest Setup
 * Global test configuration
 */

// Mock environment variables
process.env.FIREBASE_ADMIN_CREDENTIALS = 'test-credentials';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.NEXT_PUBLIC_ENABLE_TORRE_V2 = 'false';
process.env.NEXT_PUBLIC_ENABLE_PIPELINE_V2 = 'false';
process.env.LOG_LEVEL = 'error';

// Add custom matchers if needed
expect.extend({
  // Custom matchers can be added here
});
