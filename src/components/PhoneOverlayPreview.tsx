// src/components/PhoneOverlayPreview.tsx
"use client";

import Image from "next/image";
import React, { useCallback, useRef, useState, useEffect } from "react";

/**
 * PhoneOverlayPreview
 *
 * Renders a transparent-screen phone PNG template and positions children
 * (the screen content) precisely inside the cutout.
 *
 * Template: Phone_Display_Template.png — 368 × 759 px
 * Screen cutout: 338 × 734 px
 * Screen offset: 15px left, 13px top
 *
 * SCALING STRATEGY:
 * We do NOT use CSS transform: scale() because it breaks overflow-y scroll
 * inside the scaled container on many browsers. Instead we compute every
 * dimension (phone width/height, screen left/top/width/height, border-radius)
 * as real CSS px values derived from a single `scale` factor. This keeps
 * scroll containers working natively.
 */

type PhoneOverlayPreviewProps = {
  children: React.ReactNode;

  /** Screen cutout width in template pixels */
  screenWidth?: number;
  /** Screen cutout height in template pixels */
  screenHeight?: number;
  /** Border radius of the screen cutout in template pixels */
  screenRadius?: number;

  /** X offset of screen cutout from left edge in template pixels */
  screenLeft?: number;
  /** Y offset of screen cutout from top edge in template pixels */
  screenTop?: number;

  /** Template image natural width */
  templateWidth?: number;
  /** Template image natural height */
  templateHeight?: number;

  /** Maximum rendered width of the phone in CSS px */
  maxRenderWidth?: number;

  /** Template image path in /public */
  templateSrc?: string;
};

export default function PhoneOverlayPreview({
  children,
  screenWidth = 338,
  screenHeight = 734,
  screenRadius = 44,
  screenLeft = 15,
  screenTop = 13,
  templateWidth = 368,
  templateHeight = 759,
  maxRenderWidth = 250,
  templateSrc = "/Phone_Display_Template.png",
}: PhoneOverlayPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(maxRenderWidth / templateWidth);

  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const available = containerRef.current.offsetWidth;
    const cap = Math.min(templateWidth, maxRenderWidth);
    const newScale = Math.min(cap / templateWidth, available / templateWidth);
    setScale(Math.max(0.4, newScale));
  }, [templateWidth, maxRenderWidth]);

  useEffect(() => {
    updateScale();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateScale]);

  // All dimensions computed as real CSS px — no transform needed
  const phoneW = templateWidth * scale;
  const phoneH = templateHeight * scale;
  const scrL = screenLeft * scale;
  const scrT = screenTop * scale;
  const scrW = screenWidth * scale;
  const scrH = screenHeight * scale;
  const scrR = screenRadius * scale;

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      <div
        style={{
          position: "relative",
          width: phoneW,
          height: phoneH,
        }}
      >
        {/* 1. Screen content — sits behind the phone frame */}
        <div
          style={{
            position: "absolute",
            left: scrL,
            top: scrT,
            width: scrW,
            height: scrH,
            borderRadius: scrR,
            overflow: "hidden",
            background: "#0b0f14",
            zIndex: 1,
          }}
        >
          {children}
        </div>

        {/* 2. Phone template overlay */}
        <Image
          src={templateSrc}
          alt="Phone template"
          width={templateWidth}
          height={templateHeight}
          priority
          className="select-none pointer-events-none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: phoneW,
            height: phoneH,
            zIndex: 2,
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}