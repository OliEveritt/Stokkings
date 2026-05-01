/**
 * Core Business Logic for Stokkings Sprint 2
 * Aubrey de Bruyn (2609389)
 */

/**
 * US 2.1: Invitation Security Logic
 * Validates that the token follows a strict UUID v4 format.
 */
export const validateInviteToken = (token: string): boolean => {
  // Enhanced Regex to strictly enforce UUID v4 (Version 4 and Variant 1)
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(token);
};

/**
 * US 2.6: Payout Date Projection
 * Calculates future payout dates based on frequency.
 */
export const calculateExpectedDate = (baseDate: string, frequency: string): string => {
  const date = new Date(baseDate);
  
  // Logical Bridge for different payout cycles
  if (frequency === 'monthly') {
    date.setMonth(date.getMonth() + 1);
  } else if (frequency === 'quarterly') {
    date.setMonth(date.getMonth() + 3);
  }
  
  // Returns YYYY-MM-DD format, stripping the ISO time stamp
  return date.toISOString().split('T')[0];
};

/**
 * Banking Performance Metric (NIR/NII Support)
 * Calculates a pro-rated amount for members joining mid-cycle.
 */
export const calculateProRataContribution = (
  target: number, 
  activeDays: number, 
  totalDays: number
): number => {
  if (totalDays === 0) return 0;
  const result = (target / totalDays) * activeDays;
  return Math.round(result * 100) / 100; // Return rounded to 2 decimal places
};