import { notifyFirstApprover } from '../src/utils/realEmailService.js';

(async () => {
  try {
    const payload = {
      deferralNumber: 'DEF-TEST-123',
      customerName: 'ACME Corp',
      documents: ['Doc A'],
      currentApprover: { name: 'Eric Ouma', email: 'ericouma4188@gmail.com' }
    };

    const result = await notifyFirstApprover(payload);
    console.log('Mock notify result:', result);
  } catch (err) {
    console.error('Error running mock notify:', err);
    process.exit(1);
  }
})();