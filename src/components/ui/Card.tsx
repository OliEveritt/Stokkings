import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  color: string;
  bg: string;
}

export function StatCard({ label, value, color, bg }: StatCardProps) {
  return (
    <div className={`${bg} rounded-xl p-5 border border-gray-100`}>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
