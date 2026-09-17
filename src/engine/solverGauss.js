export function solveGaussPartialPivoting(A, b) {
  const n = b.length;
  const M = A.map((row) => [...row]);
  const rhs = [...b];
  const EPSILON = 1e-14;

  for (let k = 0; k < n; k++) {
    let maxVal = Math.abs(M[k][k]);
    let maxRow = k;
    for (let i = k + 1; i < n; i++) {
      const val = Math.abs(M[i][k]);
      if (val > maxVal) {
        maxVal = val;
        maxRow = i;
      }
    }
    if (maxVal < EPSILON) {
      return { success: false, x: [], error: `Матриця вироджена (стовпець ${k}, ведучий < 1e-14)` };
    }
    if (maxRow !== k) {
      const tempRow = M[k];
      M[k] = M[maxRow];
      M[maxRow] = tempRow;
      const tempB = rhs[k];
      rhs[k] = rhs[maxRow];
      rhs[maxRow] = tempB;
    }
    const pivot = M[k][k];
    for (let i = k + 1; i < n; i++) {
      const factor = M[i][k] / pivot;
      M[i][k] = 0;
      for (let j = k + 1; j < n; j++) {
        M[i][j] -= factor * M[k][j];
      }
      rhs[i] -= factor * rhs[k];
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = rhs[i];
    for (let j = i + 1; j < n; j++) {
      sum -= M[i][j] * x[j];
    }
    x[i] = sum / M[i][i];
  }
  return { success: true, x };
}