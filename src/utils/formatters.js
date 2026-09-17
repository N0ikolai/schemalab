export function formatValue(value, unit) {
  if (value === 0 || !isFinite(value)) return `0 ${unit}`;
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2).replace(/\.?0+$/, '')} М${unit}`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(2).replace(/\.?0+$/, '')} к${unit}`;
  if (abs >= 1) return `${sign}${abs.toFixed(3).replace(/\.?0+$/, '')} ${unit}`;
  if (abs >= 1e-3) return `${sign}${(abs * 1e3).toFixed(2).replace(/\.?0+$/, '')} м${unit}`;
  if (abs >= 1e-6) return `${sign}${(abs * 1e6).toFixed(2).replace(/\.?0+$/, '')} мк${unit}`;
  if (abs >= 1e-9) return `${sign}${(abs * 1e9).toFixed(2).replace(/\.?0+$/, '')} н${unit}`;
  return `${sign}${abs.toExponential(2)} ${unit}`;
}

export function formatVoltage(v) { return formatValue(v, 'В'); }
export function formatCurrent(i) { return formatValue(i, 'А'); }
export function formatPower(p) { return formatValue(p, 'Вт'); }