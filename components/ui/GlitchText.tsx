"use client";

import clsx from "clsx";

export function GlitchText({
  text,
  className,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const Component = Tag as any;
  return (
    <Component
      className={clsx("glitch inline-block", className)}
      data-text={text}
    >
      {text}
    </Component>
  );
}
