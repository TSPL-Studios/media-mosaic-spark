
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

interface VerifiedBadgeProps {
  subscriberCount: number | null;
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ 
  subscriberCount, 
  className 
}) => {
  if (!subscriberCount || subscriberCount < 1000000) {
    return null;
  }

  return (
    <Badge variant="verified" className={className}>
      <CheckCircle className="h-3 w-3 mr-1" />
      Verified
    </Badge>
  );
};
