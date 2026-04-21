export const validateInviteToken = (token: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(token);
};

export const calculateExpectedDate = (baseDate: string, frequency: string): string => {
  const date = new Date(baseDate);
  if (frequency === 'monthly') date.setMonth(date.getMonth() + 1);
  if (frequency === 'quarterly') date.setMonth(date.getMonth() + 3);
  return date.toISOString().split('T')[0];
};