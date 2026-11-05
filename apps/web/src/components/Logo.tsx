import { brand } from '@taskflow/design-tokens';

export function Logo() {
  return (
    <svg className="logo" viewBox="0 0 32 32" width="28" height="28" aria-hidden>
      <rect width="32" height="32" rx="9" fill={brand.violet} />
      <path
        d="M8 17l5.5 5.5L24 10"
        fill="none"
        stroke="#fff"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24.5" cy="9.5" r="3" fill={brand.coral} />
    </svg>
  );
}
