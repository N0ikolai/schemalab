import { expect, test } from 'vitest';
import { solveGaussPartialPivoting } from '../solverGauss.js';

test('Вирішення простої СЛАУ 2x2', () => {
  // Система:
  // 2x + 1y = 5
  // 1x - 1y = 1
  // Очікуваний результат: x = 2, y = 1
  const A = [
    [2, 1],
    [1, -1]
  ];
  const b = [5, 1];
  const result = solveGaussPartialPivoting(A, b);
  
  expect(result.success).toBe(true);
  expect(result.x[0]).toBeCloseTo(2);
  expect(result.x[1]).toBeCloseTo(1);
});

test('Виявлення виродженої матриці (КЗ або розрив)', () => {
  // Паралельні лінії (немає єдиного рішення)
  const A = [
    [1, 1],
    [2, 2]
  ];
  const b = [1, 2];
  const result = solveGaussPartialPivoting(A, b);
  
  expect(result.success).toBe(false);
  expect(result.error).toContain('вироджена');
});