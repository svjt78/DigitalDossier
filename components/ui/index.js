// components/ui/index.js
// Centralized UI Component Library

export { default as Button } from '../Button';
export { default as SkeletonCard } from '../SkeletonCard';
export { default as SkeletonDashboard } from '../SkeletonDashboard';
export { default as SkeletonList } from '../SkeletonList';
export { default as LazyCard } from '../LazyCard';

// Enhanced Card Components
export { default as BookCard } from '../BookCard';
export { default as BlogCard } from '../BlogCard';
export { default as ProductCard } from '../ProductCard';

// Layout Components
export { default as Layout } from '../Layout';
export { default as Header } from '../Header';
export { default as Sidebar } from '../Sidebar';
export { default as Navbar } from '../Navbar';

// Form Components
export { default as SubscriptionForm } from '../SubscriptionForm';
export { default as CommentForm } from '../CommentForm';

// Utility Components
export { default as FilterTabs } from '../FilterTabs';
export { default as VotingWidget } from '../VotingWidget';
export { default as CommentsSection } from '../CommentsSection';
export { default as CommentThread } from '../CommentThread';

// Modal Components  
export { default as UploadModal } from '../UploadModal';
export { default as ManageSubscriptionsModal } from '../ManageSubscriptionsModal';
export { default as ManageUsersModal } from '../ManageUsersModal';
export { default as FullScreenPDFViewer } from '../FullScreenPDFViewer';

// Design System Tokens
export const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  accent: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe', 
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1', // Indigo accent
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  secondary: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee', // Cyan secondary
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  }
};

export const spacing = {
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.25rem',
  xl: '1.5rem',
  '2xl': '2rem',
  '3xl': '3rem',
};

export const borderRadius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  blue: '0 4px 12px rgba(59, 130, 246, 0.15)',
  'blue-lg': '0 8px 25px rgba(59, 130, 246, 0.2)',
};
