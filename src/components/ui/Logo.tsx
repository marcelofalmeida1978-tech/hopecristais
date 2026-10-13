import React from 'react';

interface LogoProps {
  variant?: 'purple' | 'white' | 'lavender';
  height?: number | string;
  className?: string;
  iconOnly?: boolean;
  layout?: 'stacked' | 'horizontal';
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'purple',
  height = 48,
  className = '',
  iconOnly = false,
  layout = 'horizontal'
}) => {
  const colorMap = {
    purple: '#49338A',
    white: '#FFFFFF',
    lavender: '#8580C8'
  };

  const currentColor = colorMap[variant];

  // SVG path for the winged diamond crystal icon
  const iconD = "M 1103.340 864.519 L 1043.544 760.949 L 1103.340 657.378 L 1163.137 760.947 Z M 1003.869 1036.807 L 944.072 933.238 L 1003.869 829.667 L 1063.665 933.237 Z M 844.601 760.950 L 904.397 657.378 L 964.194 760.949 L 904.398 864.519 Z M 1003.868 485.088 L 1063.665 588.659 L 1003.868 692.230 L 944.071 588.659 Z M 1684.226 554.366 L 1282.408 554.366 L 1202.812 692.229 L 1143.016 588.659 L 1222.610 450.796 L 1744.022 450.796 L 1783.693 382.083 L 1783.693 382.077 L 1182.935 382.077 L 1103.340 519.940 L 1043.543 416.369 L 1123.138 278.505 L 1843.494 278.505 L 1883.169 209.785 L 1083.464 209.785 L 1003.868 347.650 L 924.272 209.785 L 124.643 209.785 L 164.319 278.505 L 884.597 278.505 L 964.194 416.369 L 904.397 519.941 L 824.800 382.077 L 224.117 382.077 L 263.792 450.796 L 785.125 450.796 L 864.722 588.661 L 804.925 692.231 L 725.328 554.366 L 323.588 554.366 L 363.264 623.085 L 685.653 623.085 L 1003.869 1174.247 L 1322.083 623.085 L 1644.552 623.085 Z";

  if (iconOnly) {
    return (
      <svg
        viewBox="100 200 1800 980"
        style={{ height, width: 'auto' }}
        className={className}
        fill={currentColor}
        aria-label="Hope Cristais Símbolo"
      >
        <path fillRule="evenodd" d={iconD} />
      </svg>
    );
  }

  if (layout === 'horizontal') {
    return (
      <div 
        className={`flex items-center gap-3 select-none ${className}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}
      >
        {/* Crystal Wing Icon */}
        <svg
          viewBox="100 200 1800 980"
          style={{ height: typeof height === 'number' ? height * 0.82 : height, width: 'auto' }}
          fill={currentColor}
          aria-hidden="true"
        >
          <path fillRule="evenodd" d={iconD} />
        </svg>

        {/* Textual Branding */}
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: typeof height === 'number' ? `${height * 0.58}px` : '24px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: currentColor,
              textTransform: 'uppercase'
            }}
          >
            HOPE
          </span>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: typeof height === 'number' ? `${height * 0.22}px` : '10px',
              fontWeight: 500,
              letterSpacing: '0.36em',
              color: variant === 'purple' ? 'var(--hope-lavender)' : currentColor,
              textTransform: 'uppercase',
              marginTop: '1px'
            }}
          >
            CRISTAIS
          </span>
        </div>
      </div>
    );
  }

  // Full stacked logo directly from PDF extraction
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <img
        src="/assets/hope_logo_clean.svg"
        alt="Hope Cristais Logo Oficial"
        style={{
          height,
          width: 'auto',
          filter: variant === 'white' ? 'brightness(0) invert(1)' : variant === 'lavender' ? 'sepia(1) hue-rotate(200deg)' : 'none'
        }}
        className={className}
      />
    </div>
  );
};
