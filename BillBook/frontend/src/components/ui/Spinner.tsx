import React from 'react';
import { Loader2 } from 'lucide-react';

export function Spinner({ className = 'w-6 h-6', ...props }: React.ComponentProps<typeof Loader2>) {
  return <Loader2 className={`animate-spin text-primary-600 ${className}`} {...props} />;
}