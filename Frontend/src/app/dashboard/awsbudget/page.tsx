'use client';
import { useEffect, useState } from 'react';
import { useAwsAccount } from '@/contexts/AwsAccountContext';
import { authClient } from '@/lib/auth/client';
import type { AwsBudgetRecord } from '@/lib/auth/client';
import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Box,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';

const BudgetViewer = () => {
  const { selectedAccountData } = useAwsAccount();
  const [budgets, setBudgets] = useState<AwsBudgetRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedAccountData) return;

    const fetchBudgets = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authClient.getBudgets({
          accessKey: selectedAccountData.accessKey,
          secretKey: selectedAccountData.secretKey,
          region: 'us-east-1'//selectedAccountData.region,
        });

        if (res.error) {
          setError(res.error);
          setBudgets([]);
        } else {
          setBudgets(res.data?.budgets || []);
        }
      } catch (e: any) {
        setError(e.message || 'Unknown error');
        setBudgets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBudgets();
  }, [selectedAccountData]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="30vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Error: {error}</Alert>;
  }

  if (budgets.length === 0) {
    return <Alert severity="info">No budgets found for the selected account.</Alert>;
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {budgets.map((b, i) => {
          // Parse formatted values if raw values are not reliable
          const used = parseFloat((b['Amount Used ($)'] || '0').replace(/[$,]/g, ''));
          const total = parseFloat((b['Budget ($)'] || '0').replace(/[$,]/g, ''));

          const usagePercent = total > 0 ? Math.min((used / total) * 100, 100) : 0;

          return (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: 3, minHeight: 150 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom noWrap>
                    {b.Name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Used: ${used.toFixed(2)} / ${total.toFixed(2)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={usagePercent}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: '#f0f0f0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor:
                          usagePercent > 90 ? '#d32f2f' :
                          usagePercent > 75 ? '#ed6c02' :
                          '#2e7d32',
                      },
                    }}
                  />
                  <Typography variant="caption" display="block" textAlign="right" mt={1}>
                    {usagePercent.toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default BudgetViewer;
