import { describe, it, expect } from 'vitest';
import { reorderSchedule } from '@/lib/utils/payout-utils';

describe('US-2.6 Unit: Rotational Logic', () => {
  const initialData = [
    { id: '1', memberName: 'Alice', position: 1 },
    { id: '2', memberName: 'Bob', position: 2 },
    { id: '3', memberName: 'Charlie', position: 3 },
  ];

  it('should shift positions correctly when an item moves down', () => {
    // Move Alice (index 0) to Bob's spot (index 1)
    const result = reorderSchedule(initialData, 0, 1);
    
    expect(result[0].memberName).toBe('Bob');
    expect(result[0].position).toBe(1);
    expect(result[1].memberName).toBe('Alice');
    expect(result[1].position).toBe(2);
  });

  it('should maintain mathematical sequence (1, 2, 3...) regardless of ID', () => {
    const result = reorderSchedule(initialData, 2, 0); // Move Charlie to top
    const positions = result.map(i => i.position);
    expect(positions).toEqual([1, 2, 3]);
  });
});