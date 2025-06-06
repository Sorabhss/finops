'use client';

import * as React from 'react';
import type { User } from '@/types/user';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Grid from '@mui/material/Unstable_Grid2';
import { authClient } from '@/lib/auth/client';

function isValidUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'firstName' in obj && typeof (obj as any).firstName === 'string' &&
    'lastName' in obj && typeof (obj as any).lastName === 'string' &&
    'email' in obj && typeof (obj as any).email === 'string'
  );
}

export function AccountDetailsForm(): React.JSX.Element {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');

  React.useEffect(() => {
    async function fetchUser() {
      try {
        const res = await authClient.getUser();
        if (isValidUser(res.data)) {
          setUser(res.data);
          setFirstName(res.data.firstName);
          setLastName(res.data.lastName);
          setEmail(res.data.email);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const updatedData = { firstName, lastName };
      const response = await authClient.updateUser(updatedData);

      if (!response.error) {
        setUser((prev) => prev ? { ...prev, ...updatedData } : null);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading user details...</div>;
  if (!user) return <div>User not authenticated.</div>;

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader
          subheader="You can update your personal info below"
          title="Profile"
        />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid md={6} xs={12}>
              <FormControl fullWidth required>
                <InputLabel htmlFor="firstName">First name</InputLabel>
                <OutlinedInput
                  id="firstName"
                  name="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  label="First name"
                />
              </FormControl>
            </Grid>
            <Grid md={6} xs={12}>
              <FormControl fullWidth required>
                <InputLabel htmlFor="lastName">Last name</InputLabel>
                <OutlinedInput
                  id="lastName"
                  name="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  label="Last name"
                />
              </FormControl>
            </Grid>
            <Grid md={6} xs={12}>
              <FormControl fullWidth disabled>
                <InputLabel htmlFor="email">Email address</InputLabel>
                <OutlinedInput
                  id="email"
                  name="email"
                  value={email}
                  label="Email address"
                  type="email"
                />
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save details'}
          </Button>
        </CardActions>
      </Card>
    </form>
  );
}