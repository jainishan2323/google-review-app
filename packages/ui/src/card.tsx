import * as React from "react";

interface BaseProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className = "", children }: BaseProps) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children }: BaseProps) {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children }: BaseProps) {
  return (
    <h3
      className={`text-lg font-semibold leading-none tracking-tight ${className}`}
    >
      {children}
    </h3>
  );
}

export function CardContent({ className = "", children }: BaseProps) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
}
