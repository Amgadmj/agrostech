import React from "react";
import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 32,
  className = "",
  showText = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className="relative flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-105"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.png"
          alt="AgrosTech Logo"
          width={size}
          height={size}
          className="w-full h-full object-contain"
          priority
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-none select-none">
          <div className="flex items-center gap-1">
            <span className="font-display font-bold text-lg text-white tracking-wider">
              AGROS<span className="text-[#00e676]">TECH</span>
            </span>
          </div>
          <span className="text-[9px] text-[#94a3b8] font-mono tracking-widest uppercase mt-0.5">
            Land Intelligence
          </span>
        </div>
      )}
    </div>
  );
};
