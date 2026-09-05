import React from 'react';

interface CardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Card({ title, description, children, footer, className = '' }: CardProps) {
  return (
    <div className={`bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden ${className}`}>
      {(title || description) && (
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          {title && <h3 className="text-base font-semibold leading-6 text-gray-900">{title}</h3>}
          {description && <p className="mt-1 max-w-2xl text-sm text-gray-500">{description}</p>}
        </div>
      )}
      <div className="px-4 py-5 sm:p-6">{children}</div>
      {footer && (
        <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
}