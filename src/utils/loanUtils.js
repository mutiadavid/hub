export function getLoanDisplay(deferral = {}) {
  // Helper to coerce possible numeric values (strings with commas/currency) to a Number
  const toNumber = (v) => {
    if (v == null) return 0;
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    // strip anything that's not digit, minus, decimal
    const cleaned = String(v).replace(/[^0-9.-]+/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  // Determine numeric loan amount from several possible fields or facility totals
  const candidates = [
    deferral.loanAmount,
    deferral.requestedAmount,
    deferral.amount,
    deferral.requestedLoanAmount,
    deferral.loan_amount,
    deferral.requested_amount,
  ];

  const facilitiesTotal = Array.isArray(deferral.facilities)
    ? deferral.facilities.reduce((sum, f) => {
        const v = toNumber(f?.sanctioned ?? f?.amount ?? f?.sanctionedAmount ?? 0);
        return sum + (Number.isFinite(v) ? v : 0);
      }, 0)
    : 0;

  const firstPositive = candidates.reduce((acc, c) => {
    const n = toNumber(c);
    return acc > 0 ? acc : (n > 0 ? n : 0);
  }, 0);

  const amountNumber = firstPositive > 0 ? firstPositive : (facilitiesTotal > 0 ? facilitiesTotal : 0);

  const formattedAmount = amountNumber ? `KSh ${amountNumber.toLocaleString()}` : 'Not specified';

  const THRESHOLD = 75000000; // 75,000,000 KSh
  let classification = null;
  if (amountNumber > 0) {
    classification = amountNumber < THRESHOLD ? 'below 75 million' : 'above 75 million';
  }

  return {
    amountNumber,
    formattedAmount,
    classification,
  };
}