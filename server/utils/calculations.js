/**
 * Calculate the exact calendar-based elapsed months (including fractional days)
 * between two dates.
 * 
 * @param {Date|string} startDate - Period start date
 * @param {Date|string} endDate - Period end date
 * @returns {number} - Elapsed months
 */
const calculateElapsedMonths = (startDate, endDate = new Date()) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end <= start) return 0;

  const startYear = start.getFullYear();
  const startMonth = start.getMonth();
  const startDay = start.getDate();

  const endYear = end.getFullYear();
  const endMonth = end.getMonth();
  const endDay = end.getDate();

  // Raw difference in calendar months
  let months = (endYear - startYear) * 12 + (endMonth - startMonth);

  // Adjust for fractional day differences
  if (endDay !== startDay) {
    if (endDay > startDay) {
      // Find days in current end month to calculate fraction
      const daysInEndMonth = new Date(endYear, endMonth + 1, 0).getDate();
      months += (endDay - startDay) / daysInEndMonth;
    } else {
      // endDay < startDay: subtract 1 month and calculate fraction of days elapsed in prev month
      months -= 1;
      const daysInPrevMonth = new Date(endYear, endMonth, 0).getDate();
      months += (endDay + (daysInPrevMonth - startDay)) / daysInPrevMonth;
    }
  }

  return months;
};

/**
 * Calculate portfolio values for a single specific investment.
 * 
 * @param {number} principal - Principal investment amount
 * @param {number} annualRate - Annual interest rate
 * @param {Date|string} startDate - Investment start date
 * @param {string} status - Plan status
 * @param {Date|string} endDate - Calculation end date (defaults to current date)
 * @returns {object} - Portfolio stats
 */
const calculatePortfolio = (principal, annualRate, startDate, status, endDate = new Date(), rateHistory = null) => {
  const parsedPrincipal = Number(principal) || 0;
  const parsedRate = Number(annualRate) || 0;

  if (!parsedPrincipal || !startDate || status === 'PENDING') {
    return {
      principalAmount: parsedPrincipal,
      accruedInterest: 0,
      currentPortfolioValue: parsedPrincipal,
      monthlyYield: 0,
      yearlyYield: 0,
      elapsedMonths: 0,
    };
  }

  const calculationEnd = new Date(endDate);
  let totalAccruedInterest = 0;
  let currentActiveRate = parsedRate;
  let totalElapsedMonths = calculateElapsedMonths(startDate, calculationEnd);

  if (rateHistory && Array.isArray(rateHistory) && rateHistory.length > 0) {
    // Sort rate history entries by effectiveFrom ascending
    const sortedHistory = [...rateHistory].sort(
      (a, b) => new Date(a.effectiveFrom) - new Date(b.effectiveFrom)
    );

    for (let i = 0; i < sortedHistory.length; i++) {
      const entry = sortedHistory[i];
      const periodRate = Number(entry.annualInterestRate) || 0;
      const periodStart = new Date(entry.effectiveFrom);
      
      // Determine end of this rate period: either entry.effectiveTo, or next entry's effectiveFrom, or calculationEnd
      let periodEnd = calculationEnd;
      if (entry.effectiveTo) {
        periodEnd = new Date(entry.effectiveTo);
      } else if (i < sortedHistory.length - 1) {
        periodEnd = new Date(sortedHistory[i + 1].effectiveFrom);
      }

      if (periodEnd > calculationEnd) {
        periodEnd = calculationEnd;
      }

      if (periodEnd > periodStart) {
        const periodElapsedMonths = calculateElapsedMonths(periodStart, periodEnd);
        const periodMonthlyRate = periodRate / 12;
        const periodInterest = parsedPrincipal * (periodMonthlyRate / 100) * periodElapsedMonths;
        totalAccruedInterest += periodInterest;
      }

      if (!entry.effectiveTo || new Date(entry.effectiveTo) >= calculationEnd) {
        currentActiveRate = periodRate;
      }
    }
  } else {
    // Single rate fallback
    const monthlyRate = parsedRate / 12;
    totalAccruedInterest = parsedPrincipal * (monthlyRate / 100) * totalElapsedMonths;
  }

  const currentPortfolioValue = parsedPrincipal + totalAccruedInterest;
  const currentMonthlyRate = currentActiveRate / 12;
  const monthlyYield = (parsedPrincipal * currentMonthlyRate) / 100;
  const yearlyYield = (parsedPrincipal * currentActiveRate) / 100;

  return {
    principalAmount: parsedPrincipal,
    annualInterestRate: currentActiveRate,
    accruedInterest: Math.round(totalAccruedInterest * 100) / 100,
    currentPortfolioValue: Math.round(currentPortfolioValue * 100) / 100,
    monthlyYield: Math.round(monthlyYield * 100) / 100,
    yearlyYield: Math.round(yearlyYield * 100) / 100,
    elapsedMonths: Math.round(totalElapsedMonths * 100) / 100,
  };
};

/**
 * Calculate the progressive timeline of multiple investments for a client.
 * Accrues interest on each investment independently from its start date to present.
 * 
 * @param {Array} investments - List of investment records for the user
 * @returns {object} - Combined ledger calculations
 */
const calculateTimelinePortfolios = (investments) => {
  if (!investments || investments.length === 0) {
    return {
      totalInvested: 0,
      totalProfit: 0,
      currentPortfolioValue: 0,
      investmentsWithCalcs: [],
    };
  }

  // Sort investments by start date ascending
  const sorted = [...investments].sort(
    (a, b) => new Date(a.investmentStartDate) - new Date(b.investmentStartDate)
  );

  const investmentsWithCalcs = [];
  let totalInvested = 0;
  let totalProfit = 0;

  for (let i = 0; i < sorted.length; i++) {
    const inv = sorted[i];

    const portfolio = calculatePortfolio(
      inv.principalAmount,
      inv.annualInterestRate,
      inv.investmentStartDate,
      inv.status,
      new Date(),
      inv.rateHistory
    );

    totalInvested += inv.principalAmount;
    totalProfit += portfolio.accruedInterest;

    investmentsWithCalcs.push({
      ...(inv.toObject ? inv.toObject() : inv),
      calculations: {
        accruedInterest: portfolio.accruedInterest,
        individualGain: Math.round((inv.principalAmount + portfolio.accruedInterest) * 100) / 100,
        elapsedMonths: portfolio.elapsedMonths,
        activeAnnualRate: portfolio.annualInterestRate,
      },
    });
  }

  return {
    totalInvested,
    totalProfit: Math.round(totalProfit * 100) / 100,
    investmentsWithCalcs,
  };
};

module.exports = {
  calculateElapsedMonths,
  calculatePortfolio,
  calculateTimelinePortfolios,
};
