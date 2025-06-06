import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  { key: 'overview', title: 'Overview', href: paths.dashboard.overview, icon: 'layout-dashboard' },
  { key: 'tagwisecost', title: 'TagWiseCost', href: paths.dashboard.tagwisecost, icon: 'tag' },
  { key: 'awsbudget', title: 'AwsBudget', href: paths.dashboard.awsbudget, icon: 'wallet' },
  { key: 'settings', title: 'Settings', href: paths.dashboard.settings, icon: 'gear-six' },
  { key: 'account', title: 'Account', href: paths.dashboard.account, icon: 'user' },
  { key: 'error', title: 'Error', href: paths.errors.notFound, icon: 'x-square' },
] satisfies NavItemConfig[];
