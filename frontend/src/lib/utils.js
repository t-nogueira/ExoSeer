import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined) return "N/A";
  if (typeof num !== 'number') return String(num);
  
  if (Math.abs(num) < 0.001 && num !== 0) {
    return num.toExponential(2);
  }
  
  return num.toFixed(decimals);
}

export function formatPeriod(period) {
  if (!period) return "N/A";
  return `${formatNumber(period)} days`;
}

export function formatRadius(radius) {
  if (!radius) return "N/A";
  return `${formatNumber(radius)} R⊕`;
}

export function formatMass(mass) {
  if (!mass) return "N/A";
  return `${formatNumber(mass)} M⊕`;
}

export function formatDepth(depth) {
  if (!depth) return "N/A";
  const ppm = depth * 1e6;
  return `${formatNumber(ppm)} ppm`;
}

export function formatDuration(duration) {
  if (!duration) return "N/A";
  return `${formatNumber(duration)} hrs`;
}

export function getConfidenceColor(confidence) {
  if (confidence >= 0.8) return "bg-green-500";
  if (confidence >= 0.6) return "bg-yellow-500";
  if (confidence >= 0.4) return "bg-orange-500";
  return "bg-red-500";
}

export function getStatusBadgeVariant(status) {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return 'bg-green-600 text-white';
    case 'candidate':
      return 'bg-blue-600 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
}