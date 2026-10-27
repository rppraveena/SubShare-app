import React from 'react';

interface AuthCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children, title, subtitle }) => {
  return (
    <div className="max-w-md w-full mx-auto bg-white shadow-lg rounded-2xl border border-gray-100 p-8 space-y-6">
      {title && <h1 className="text-2xl font-bold text-gray-900 text-center">{title}</h1>}
      {subtitle && <p className="text-sm text-gray-600 text-center mb-4">{subtitle}</p>}
      {children}
    </div>
  );
};
