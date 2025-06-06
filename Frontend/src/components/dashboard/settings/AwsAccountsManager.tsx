'use client';

import * as React from 'react';
import {
  Button,
  Card,
  CardContent,
  CardActions,
  TextField,
  Stack,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

import { authClient } from '@/lib/auth/client';

interface AwsAccount {
  id: string;            // changed from _id to id to match authClient interface
  name: string;          // changed from accountName to name to match authClient interface
  accessKey: string;
  secretKey: string;
}

export function AwsAccountsManager() {
  const [accounts, setAccounts] = React.useState<AwsAccount[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  // Form state for add/edit
  const [accountName, setAccountName] = React.useState('');
  const [accessKey, setAccessKey] = React.useState('');
  const [secretKey, setSecretKey] = React.useState('');
  const [editId, setEditId] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  React.useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    setLoading(true);
    setError('');
    try {
      const { awsAccounts, error } = await authClient.getAwsAccounts();
      if (error) throw new Error(error);
      setAccounts(awsAccounts || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching accounts');
    } finally {
      setLoading(false);
    }
  }

  function openAddDialog() {
    setEditId(null);
    setAccountName('');
    setAccessKey('');
    setSecretKey('');
    setDialogOpen(true);
    setError('');
    setSuccess('');
  }

  function openEditDialog(account: AwsAccount) {
    setEditId(account.id);
    setAccountName(account.name);
    setAccessKey(account.accessKey);
    setSecretKey(account.secretKey);
    setDialogOpen(true);
    setError('');
    setSuccess('');
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this AWS account?')) return;

    setLoading(true);
    setError('');
    try {
      const { deletedAccountId, error } = await authClient.deleteAwsAccount(id);
      if (error) throw new Error(error);
      setSuccess('Account deleted successfully');
      fetchAccounts();
    } catch (err: any) {
      setError(err.message || 'Error deleting account');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!accountName || !accessKey || !secretKey) {
      setError('All fields are required');
      return;
    }

    setLoading(true);

    try {
      if (editId) {
        // Update existing account
        const { awsAccount, error } = await authClient.updateAwsAccount(editId, {
          name: accountName,
          accessKey,
          secretKey,
        });
        if (error) {
          setError(error);
          return;
        }
        setSuccess('Account updated successfully');
      } else {
        // Add new account
        const { awsAccount, error } = await authClient.addAwsAccount({
          name: accountName,
          accessKey,
          secretKey,
        });
        if (error) {
          setError(error);
          return;
        }
        setSuccess('Account added successfully');
      }
      setDialogOpen(false);
      fetchAccounts();
    } catch (err: any) {
      setError(err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">AWS Accounts</Typography>
            <Button variant="contained" onClick={openAddDialog}>
              Add Account
            </Button>
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          {loading && <CircularProgress />}

          {!loading && accounts.length === 0 && (
            <Typography>No AWS accounts added yet.</Typography>
          )}

          <List>
            {accounts.map((account) => (
              <ListItem key={account.id} divider>
                <ListItemText
                  primary={account.name}
                  secondary={`Access Key: ${account.accessKey}`}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => openEditDialog(account)} aria-label="edit">
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleDelete(account.id)} aria-label="delete">
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Stack>
      </CardContent>

      {/* Dialog for Add/Edit */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{editId ? 'Edit AWS Account' : 'Add AWS Account'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ width: 400 }}>
              <TextField
                label="Account Name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Access Key"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Secret Key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                required
                fullWidth
                type="password"
              />
              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">{success}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Card>
  );
}
