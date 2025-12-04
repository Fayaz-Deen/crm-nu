import type { Contact } from '../../types';
import { calculateProfileCompleteness } from '../../utils/profileCompleteness';

interface ProfileCompletenessProps {
  contact: Contact;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProfileCompleteness({ contact, showLabel = true, size = 'md' }: ProfileCompletenessProps) {
  const { percentage, missingFields } = calculateProfileCompleteness(contact);

  const getColor = () => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = () => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const sizeClasses = {
    sm: { bar: 'h-1', text: 'text-xs' },
    md: { bar: 'h-2', text: 'text-sm' },
    lg: { bar: 'h-3', text: 'text-base' },
  };

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className={`flex items-center justify-between ${sizeClasses[size].text}`}>
          <span className="text-[hsl(var(--muted-foreground))]">Profile completeness</span>
          <span className={`font-medium ${getTextColor()}`}>{percentage}%</span>
        </div>
      )}
      <div className={`w-full rounded-full bg-[hsl(var(--muted))] ${sizeClasses[size].bar}`}>
        <div
          className={`${sizeClasses[size].bar} rounded-full transition-all duration-300 ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && missingFields.length > 0 && percentage < 100 && (
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Missing: {missingFields.slice(0, 3).join(', ')}{missingFields.length > 3 ? `, +${missingFields.length - 3} more` : ''}
        </p>
      )}
    </div>
  );
}

// Compact badge version for contact cards
export function ProfileCompletenessBadge({ contact }: { contact: Contact }) {
  const { percentage } = calculateProfileCompleteness(contact);

  const getColor = () => {
    if (percentage >= 80) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getColor()}`}>
      {percentage}%
    </span>
  );
}
