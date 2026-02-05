import React from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { Button } from '@/components/ui/button';
import { RotateCcw, AlertCircle } from 'lucide-react';

interface DashboardSectionErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

function SectionErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-red-200 rounded-xl bg-red-50/50 min-h-[200px]">
      <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
      <h3 className="text-lg font-semibold text-red-900 mb-1">Failed to load section</h3>
      <p className="text-sm text-red-600 mb-4 max-w-sm text-center">
        {error.message}
      </p>
      <Button 
        variant="outline"
        size="sm"
        onClick={resetErrorBoundary} 
        className="border-red-200 hover:bg-red-50 text-red-700 hover:text-red-800"
      >
        <RotateCcw className="w-3 h-3 mr-2" />
        Retry
      </Button>
    </div>
  );
}

export function DashboardSectionErrorBoundary({ children, onReset }: DashboardSectionErrorBoundaryProps) {
  return (
    <ErrorBoundary 
        FallbackComponent={SectionErrorFallback} 
        onReset={onReset}
    >
      {children}
    </ErrorBoundary>
  );
}
