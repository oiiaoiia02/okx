import { useState } from "react";
import { getTokenLogoUrl, getTokenColor } from "@/utils/cryptoIcons";

interface TokenLogoProps {
  symbol: string;
  size?: number;
  className?: string;
}

export default function TokenLogo({ symbol, size = 28, className = "" }: TokenLogoProps) {
  const [imgError, setImgError] = useState(false);
  const s = symbol.toUpperCase();
  const url = getTokenLogoUrl(s);
  const color = getTokenColor(s);

  if (imgError) {
    return (
      <div
        className={`rounded-full flex items-center justify-center font-bold text-white ${className}`}
        style={{
          width: size,
          height: size,
          background: `linear-gradient(135deg, ${color}, ${color}88)`,
          fontSize: size * 0.35,
        }}
      >
        {s.slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={s}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      style={{ width: size, height: size }}
      onError={() => setImgError(true)}
      loading="lazy"
    />
  );
}
