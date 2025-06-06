'use client';

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { authClient } from '@/lib/auth/client'; // Adjust the import path to your actual structure

// Define User type
type User = {
  firstName: string;
  lastName: string;
  avatar?: string;
  city?: string;
  country?: string;
  timezone?: string;
};

// Optional: type guard to ensure valid user object
function isValidUser(obj: any): obj is User {
  return (
    obj &&
    typeof obj.firstName === 'string' &&
    typeof obj.lastName === 'string'
  );
}

export function AccountInfo(): React.JSX.Element {
  const [user, setUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    async function fetchUser() {
      try {
        const res = await authClient.getUser();
        if (res.data && isValidUser(res.data)) {
          setUser(res.data);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setUser(null);
      }
    }

    fetchUser();
  }, []);

  if (!user) {
    return <Typography>Loading user info...</Typography>;
  }

  const fullName = `${user.firstName} ${user.lastName}`;
  const avatar = user.avatar && user.avatar !== '' ? user.avatar : '/assets/avatar.png';

  return (
    <Card>
      <CardContent>
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <Avatar src={avatar} sx={{ height: 80, width: 80 }} />
          <Stack spacing={1} sx={{ textAlign: 'center' }}>
            <Typography variant="h5">{fullName}</Typography>
            {(user.city && user.country) && (
              <Typography color="text.secondary" variant="body2">
                {user.city}, {user.country}
              </Typography>
            )}
            {user.timezone && (
              <Typography color="text.secondary" variant="body2">
                {user.timezone}
              </Typography>
            )}
          </Stack>
        </Stack>
      </CardContent>
      <Divider />
      <CardActions>
        <Button fullWidth variant="text">
          Upload picture
        </Button>
      </CardActions>
    </Card>
  );
}
