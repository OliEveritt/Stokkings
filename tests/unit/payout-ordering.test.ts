import { describe, it, expect } from 'vitest';

// The logic we are testing: A clean reorder function
const reorderList = (list: any[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  
  // Update the 'position' property to match the new array index
  return result.map((item, index) => ({ ...item, position: index + 1 }));
};

describe('US-2.6 Payout Ordering Logic', () => {
  const mockSchedule = [
    { id: '1', name: 'Uno', position: 1 },
    { id: '2', name: 'Aubrey', position: 2 },
    { id: '3', name: 'Zoe', position: 3 },
  ];

  it('should move the last member to the first position correctly (UAT 2)', () => {
    // Move Zoe (index 2) to the top (index 0)
    const updated = reorderList(mockSchedule, 2, 0);
    
    expect(updated[0].name).toBe('Zoe');
    expect(updated[0].position).toBe(1);
    expect(updated[1].name).toBe('Uno');
    expect(updated[1].position).toBe(2);
  });

  it('should maintain a continuous sequence of positions', () => {
    const updated = reorderList(mockSchedule, 0, 2);
    const positions = updated.map(u => u.position);
    expect(positions).toEqual([1, 2, 3]);
  });
});