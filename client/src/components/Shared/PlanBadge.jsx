import React from 'react';
import { Crown, Star, Shield, Zap } from 'lucide-react';

const PlanBadge = ({ planSlug, planName }) => {
    const getBadgeStyle = (slug) => {
        // Normalize slug to lowercase for comparison
        const s = (slug || '').toLowerCase();

        if (s.includes('enterprise')) {
            return {
                bg: 'bg-amber-100 dark:bg-amber-900/30',
                text: 'text-amber-700 dark:text-amber-400',
                border: 'border-amber-200 dark:border-amber-700',
                icon: <Crown className="w-3 h-3 mr-1" fill="currentColor" />
            };
        } else if (s.includes('pro')) {
            return {
                bg: 'bg-indigo-100 dark:bg-indigo-900/30',
                text: 'text-indigo-700 dark:text-indigo-400',
                border: 'border-indigo-200 dark:border-indigo-700',
                icon: <Star className="w-3 h-3 mr-1" fill="currentColor" />
            };
        } else if (s.includes('starter') || s.includes('basic')) {
            return {
                bg: 'bg-sky-100 dark:bg-sky-900/30',
                text: 'text-sky-700 dark:text-sky-400',
                border: 'border-sky-200 dark:border-sky-700',
                icon: <Zap className="w-3 h-3 mr-1" fill="currentColor" />
            };
        } else {
            // Free or unknown
            return {
                bg: 'bg-gray-100 dark:bg-gray-800',
                text: 'text-gray-600 dark:text-gray-400',
                border: 'border-gray-200 dark:border-gray-700',
                icon: <Shield className="w-3 h-3 mr-1" />
            };
        }
    };

    const style = getBadgeStyle(planSlug);

    return (
        <div className={`flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold ${style.bg} ${style.text} ${style.border}`}>
            {style.icon}
            <span>{planName || 'Free'}</span>
        </div>
    );
};

export default PlanBadge;
