'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import { ArrowSquareUpRight as ArrowSquareUpRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowSquareUpRight';
import { CaretUpDown as CaretUpDownIcon } from '@phosphor-icons/react/dist/ssr/CaretUpDown';

import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';
import { isNavItemActive } from '@/lib/is-nav-item-active';
import { Logo } from '@/components/core/logo';
import { navItems } from './config';
import { navIcons } from './nav-icons';
import { useAwsAccount } from '@/contexts/AwsAccountContext';

export function SideNav(): React.JSX.Element {
  const pathname = usePathname();
  const { accounts: awsAccounts, selectedAccount, setSelectedAccount, loading } = useAwsAccount();

  const handleChange = (event: SelectChangeEvent<string>) => {
    setSelectedAccount(event.target.value);
  };

  // Calculate sticky header height including the divider height (1px)
  // Adjust this if you change padding or margins
  const stickyHeaderHeight = 215;

  return (
    <Box
      sx={{
        '--SideNav-background': 'var(--mui-palette-neutral-950)',
        '--SideNav-color': 'var(--mui-palette-common-white)',
        '--NavItem-color': 'var(--mui-palette-neutral-300)',
        '--NavItem-hover-background': 'rgba(255, 255, 255, 0.04)',
        '--NavItem-active-background': 'var(--mui-palette-primary-main)',
        '--NavItem-active-color': 'var(--mui-palette-primary-contrastText)',
        '--NavItem-disabled-color': 'var(--mui-palette-neutral-500)',
        '--NavItem-icon-color': 'var(--mui-palette-neutral-400)',
        '--NavItem-icon-active-color': 'var(--mui-palette-primary-contrastText)',
        '--NavItem-icon-disabled-color': 'var(--mui-palette-neutral-600)',
        bgcolor: 'var(--SideNav-background)',
        color: 'var(--SideNav-color)',
        display: { xs: 'none', lg: 'flex' },
        flexDirection: 'column',
        height: '100vh',
        position: 'fixed',
        width: 'var(--SideNav-width)',
        top: 0,
        left: 0,
        zIndex: 'var(--SideNav-zIndex)',
      }}
    >
      {/* Sticky header: Logo + AWS Dropdown + Divider */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'var(--SideNav-background)',
          borderBottom: 'none', // we'll use explicit divider below
          height: stickyHeaderHeight,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          p: 2,
          boxSizing: 'border-box',
        }}
      >
        <Box component={RouterLink} href={paths.home} sx={{ display: 'inline-flex' }}>
          <Logo color="light" height={32} width={210} />
        </Box>

        <Box
          sx={{
            border: '1px solid var(--mui-palette-neutral-700)',
            borderRadius: 2,
            p: 3,
          }}
        >
          <Stack spacing={2}>
            <Typography variant="subtitle2" sx={{ color: 'var(--mui-palette-neutral-100)' }}>
              Select an AWS account
            </Typography>

            <FormControl
              fullWidth
              variant="outlined"
              size="small"
              sx={{
                backgroundColor: 'var(--mui-palette-neutral-950)',
                borderRadius: '12px',
                border: '1px solid var(--mui-palette-neutral-700)',
              }}
              disabled={loading || awsAccounts.length === 0}
            >
              <InputLabel sx={{ color: 'var(--mui-palette-neutral-400)' }} id="aws-account-select-label">
                AWS Account
              </InputLabel>
              <Select
                labelId="aws-account-select-label"
                id="aws-account-select"
                value={selectedAccount}
                onChange={handleChange}
                label="AWS Account"
                IconComponent={CaretUpDownIcon}
                sx={{
                  color: 'inherit',
                  '& .MuiSvgIcon-root': {
                    color: 'var(--mui-palette-neutral-400)',
                  },
                }}
              >
                {awsAccounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <CircularProgress size={20} color="inherit" />
              </Box>
            )}
          </Stack>
        </Box>

        {/* Divider immediately below AWS selector */}
        <Divider sx={{ borderColor: 'var(--mui-palette-neutral-700)' }} />
      </Box>

      {/* Scrollable content below the divider: Nav + Footer */}
      <Box
  sx={{
    flexGrow: 1,
    overflowY: 'scroll',
    height: `calc(100vh - ${stickyHeaderHeight}px)`,
    px: 2,
    py: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    scrollbarWidth: 'none', // Firefox
    '&::-webkit-scrollbar': {
      display: 'none', // Chrome, Safari
    },
  }}
>

        {/* Navigation */}
        <Box component="nav" sx={{ flexGrow: 1 }}>
          {renderNavItems({ pathname, items: navItems })}
        </Box>

        {/* Divider above footer */}
        <Divider sx={{ borderColor: 'var(--mui-palette-neutral-700)', my: 1 }} />

        {/* Footer */}
        <Stack spacing={2} sx={{ mt: 2 }}>
          <div>
            <Typography color="var(--mui-palette-neutral-100)" variant="subtitle2">
              Need more features?
            </Typography>
            <Typography color="var(--mui-palette-neutral-400)" variant="body2">
              Check out our Pro solution template.
            </Typography>
          </div>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box
              component="img"
              alt="Pro version"
              src="/assets/devias-kit-pro.png"
              sx={{ height: 'auto', width: '160px' }}
            />
          </Box>
          <Button
            component="a"
            endIcon={<ArrowSquareUpRightIcon fontSize="var(--icon-fontSize-md)" />}
            fullWidth
            href="https://material-kit-pro-react.devias.io/"
            sx={{ mt: 2 }}
            target="_blank"
            variant="contained"
          >
            Pro version
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

// Render navigation links
function renderNavItems({
  items = [],
  pathname,
}: {
  items?: NavItemConfig[];
  pathname: string;
}): React.JSX.Element {
  const children = items.map(({ key, ...item }) => (
    <NavItem key={key} pathname={pathname} {...item} />
  ));

  return (
    <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {children}
    </Stack>
  );
}

// NavItem component
interface NavItemProps extends Omit<NavItemConfig, 'items'> {
  pathname: string;
}

function NavItem({ disabled, external, href, icon, matcher, pathname, title }: NavItemProps): React.JSX.Element {
  const active = isNavItemActive({ disabled, external, href, matcher, pathname });
  const Icon = icon ? navIcons[icon] : null;

  return (
    <li>
      <Box
        {...(href
          ? {
              component: external ? 'a' : RouterLink,
              href,
              target: external ? '_blank' : undefined,
              rel: external ? 'noreferrer' : undefined,
            }
          : { role: 'button' })}
        sx={{
          alignItems: 'center',
          borderRadius: 1,
          color: 'var(--NavItem-color)',
          cursor: 'pointer',
          display: 'flex',
          flex: '0 0 auto',
          gap: 1,
          p: '6px 16px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          ...(disabled && {
            bgcolor: 'var(--NavItem-disabled-background)',
            color: 'var(--NavItem-disabled-color)',
            cursor: 'not-allowed',
          }),
          ...(active && {
            bgcolor: 'var(--NavItem-active-background)',
            color: 'var(--NavItem-active-color)',
          }),
        }}
      >
        {Icon && (
          <Icon
            fill={active ? 'var(--NavItem-icon-active-color)' : 'var(--NavItem-icon-color)'}
            fontSize="var(--icon-fontSize-md)"
            weight={active ? 'fill' : undefined}
          />
        )}
        <Typography
          component="span"
          sx={{ color: 'inherit', fontSize: '0.875rem', fontWeight: 500, lineHeight: '28px' }}
        >
          {title}
        </Typography>
      </Box>
    </li>
  );
}