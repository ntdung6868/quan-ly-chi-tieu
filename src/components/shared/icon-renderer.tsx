"use client";

import * as Icons from "lucide-react";

interface IconRendererProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export function IconRenderer({ name, className, style }: IconRendererProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iconsMap = Icons as any;
  const Icon = iconsMap[name] ?? Icons.HelpCircle;
  return <Icon className={className} style={style} />;
}
