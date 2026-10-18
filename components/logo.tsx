import React from "react";

export function Logo({
  size = 22,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Client Hub Logo"
    >
      <rect width="24" height="24" rx="6" fill="#09090B" />
      <path
        d="M18 8C16.8 6.2 14.6 5 12 5C7.58172 5 4 8.58172 4 13C4 17.4183 7.58172 21 12 21C14.6 21 16.8 19.8 18 18"
        stroke="#7C60FB"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="13"
        r="3"
        fill="#A78BFA"
        stroke="#09090B"
        strokeWidth="1.5"
      />
      <circle cx="18" cy="8" r="2" fill="#22C55E" />
    </svg>
  );
}
