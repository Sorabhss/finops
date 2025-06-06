'use client';

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { usePathname } from 'next/navigation';

import { Bell as BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';
import { List as ListIcon } from '@phosphor-icons/react/dist/ssr/List';
import { Users as UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';

import { usePopover } from '@/hooks/use-popover';
import { MobileNav } from './mobile-nav';
import { UserPopover } from './user-popover';

export function MainNav(): React.JSX.Element {
  const [openNav, setOpenNav] = React.useState<boolean>(false);
  const userPopover = usePopover<HTMLDivElement>();
  const pathname = usePathname();

  const pageTitles: Record<string, string> = {
    '/dashboard': 'AWS Finops Dashboard',
    '/dashboard/aws': 'AWS Finops Dashboard',
    '/dashboard/settings': 'Settings',
    '/dashboard/account': 'Profile',
    '/reports': 'Reports',
    'dashboard/awsbudget': 'Aws Bugdet',
    'dashboard/tagwisecost': 'Tag Wise Cost'
  };

  const pageTitle = pageTitles[pathname] || 'Page';

  return (
    <>
      <Box
        component="header"
        sx={{
          bgcolor: 'neutral.950',
          color: 'common.white',
          borderBottom: '1px solid',
          borderColor: 'neutral.700', // Thin bottom border only
          position: 'sticky',
          top: 0,
          zIndex: 'appBar',
          boxShadow: 3,
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '64px',
            px: 2,
          }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <IconButton
              onClick={() => setOpenNav(true)}
              sx={{
                display: { lg: 'none' },
                color: 'neutral.400',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.04)',
                },
              }}
            >
              <ListIcon />
            </IconButton>
          </Stack>

          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              textAlign: 'center',
              color: 'common.white', // White page title
              borderBottom: '0px solid',
              display: 'inline-block',
              px: 1,
            }}
          >
            {pageTitle}
          </Typography>

          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Tooltip title="Contacts">
              <IconButton
                sx={{
                  color: pathname === '/profile' ? 'primary.main' : 'neutral.400',
                  border: pathname === '/profile' ? '1px solid' : 'none',
                  borderColor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.04)',
                  },
                }}
              >
                <UsersIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Notifications">
              <Badge badgeContent={4} color="success" variant="dot">
                <IconButton
                  sx={{
                    color: pathname === '/reports' ? 'primary.main' : 'neutral.400',
                    border: pathname === '/reports' ? '1px solid' : 'none',
                    borderColor: 'primary.main',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.04)',
                    },
                  }}
                >
                  <BellIcon />
                </IconButton>
              </Badge>
            </Tooltip>

            <Avatar
              onClick={userPopover.handleOpen}
              ref={userPopover.anchorRef}
              src="/assets/avatar.png"
              sx={{
                cursor: 'pointer',
                border: '2px solid',
                borderColor: 'primary.main',
              }}
            />
          </Stack>
        </Stack>
      </Box>

      <UserPopover
        anchorEl={userPopover.anchorRef.current}
        onClose={userPopover.handleClose}
        open={userPopover.open}
      />
      <MobileNav
        open={openNav}
        onClose={() => {
          setOpenNav(false);
        }}
      />
    </>
  );
}
