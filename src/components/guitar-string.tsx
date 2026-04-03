"use client";

import React, { useRef } from "react";
import gsap from "gsap";

export const GuitarString = () => {
  const pathRef = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const initialPath = "M 0 60 Q 500 60 1000 60";

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !pathRef.current) return;

    const bounds = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - bounds.left) / bounds.width) * 1000;
    // Dramatically reduced multiplier (2.5x) for a more controlled stretch
    const y = 60 + ((e.clientY - (bounds.top + bounds.height / 2)) * 2.5);

    const newPath = `M 0 60 Q ${x} ${y} 1000 60`;

    gsap.to(pathRef.current, {
      attr: { d: newPath },
      duration: 0.2,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  const handleMouseLeave = () => {
    if (!pathRef.current) return;

    gsap.to(pathRef.current, {
      attr: { d: initialPath },
      duration: 1.5,
      ease: "elastic.out(1, 0.2)",
      overwrite: "auto",
    });
  };

  return (
    <div className="w-full h-[1px] flex items-center justify-center cursor-pointer overflow-visible relative">
      <svg
        ref={svgRef}
        viewBox="0 0 1000 120"
        preserveAspectRatio="none"
        className="w-full h-[120px] absolute overflow-visible pointer-events-auto"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <path
          ref={pathRef}
          d={initialPath}
          stroke="white"
          strokeWidth="1.5"
          fill="transparent"
          className="pointer-events-none"
        />
      </svg>
    </div>
  );
};
