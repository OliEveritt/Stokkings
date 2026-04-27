// src/lib/utils/payout-utils.ts

export const reorderSchedule = (items: any[], startIndex: number, endIndex: number) => {
  const result = Array.from(items);
  // Remove the item from its original position
  const [removed] = result.splice(startIndex, 1);
  // Insert it into the new position
  result.splice(endIndex, 0, removed);

  // Recalculate positions to ensure mathematical integrity (1, 2, 3...)
  return result.map((item, index) => ({
    ...item,
    position: index + 1,
  }));
};