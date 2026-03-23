"use client";

import { memo } from "react";
import * as Icons from "lucide-react";

interface IconRendererProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

// Memo prevents re-render when parent re-renders with same props
export const IconRenderer = memo(function IconRenderer({ name, className, style }: IconRendererProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (Icons as any)[name] ?? Icons.HelpCircle;
  return <Icon className={className} style={style} />;
});
