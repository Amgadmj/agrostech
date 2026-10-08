/**
 * Standard Brazilian Portuguese (pt-BR) number and territorial formatting utilities.
 * Ensures consistent comma-as-decimal and dot-as-thousand separator across all screens.
 */

const ptBrNumberFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format hectare values with standard Brazilian notation.
 * Example: 217.12 -> "217,12 ha"
 */
export function formatHa(hectares: number, decimals: number = 2): string {
  if (typeof hectares !== "number" || isNaN(hectares)) return "0,00 ha";
  const formatter = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${formatter.format(hectares)} ha`;
}

/**
 * Format numeric values with pt-BR thousand (dot) and decimal (comma) separators.
 * Example: 1192500 -> "1.192.500,00" (or "1.192.500" if decimals=0)
 */
export function formatNumber(value: number, decimals: number = 2): string {
  if (typeof value !== "number" || isNaN(value)) return "0";
  const formatter = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return formatter.format(value);
}

/**
 * Format currency values in BRL (Real).
 * Example: 1192500 -> "R$ 1.192.500,00"
 */
export function formatCurrency(value: number): string {
  if (typeof value !== "number" || isNaN(value)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Format currency in compact millions/thousands for headers and KPI chips.
 * Example: 1190000 -> "R$ 1,19M"
 */
export function formatCurrencyCompact(value: number): string {
  if (typeof value !== "number" || isNaN(value)) return "R$ 0";
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `R$ ${new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(millions)}M`;
  }
  if (value >= 1_000) {
    const thousands = value / 1_000;
    return `R$ ${new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(thousands)}k`;
  }
  return formatCurrency(value);
}

/**
 * Format sacas of grain (soja/milho 60kg).
 * Example: 9540 -> "9.540 sc"
 */
export function formatSacas(sacas: number): string {
  if (typeof sacas !== "number" || isNaN(sacas)) return "0 sc";
  const formatter = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
  });
  return `${formatter.format(sacas)} sc`;
}

/**
 * Format percentages with comma decimal.
 * Example: 48.0 -> "48,0%"
 */
export function formatPercent(value: number, decimals: number = 1): string {
  if (typeof value !== "number" || isNaN(value)) return "0%";
  const formatter = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${formatter.format(value)}%`;
}
