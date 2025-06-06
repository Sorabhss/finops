'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useAwsAccount } from '@/contexts/AwsAccountContext';
import { authClient } from '@/lib/auth/client';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Paper,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import CategoryIcon from '@mui/icons-material/Category';

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const awsRegions = [
  'us-east-1',
  'us-west-1',
  'us-west-2',
  'eu-central-1',
  'eu-west-1',
  'ap-south-1',
  'ap-northeast-1',
];

interface CostData {
  total_cost: number;
  average_cost: number;
  unique_services: number;
}

function FilterInputs({
  region,
  setRegion,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: {
  region: string;
  setRegion: React.Dispatch<React.SetStateAction<string>>;
  startDate: Dayjs;
  setStartDate: React.Dispatch<React.SetStateAction<Dayjs>>;
  endDate: Dayjs;
  setEndDate: React.Dispatch<React.SetStateAction<Dayjs>>;
}) {
  return (
    <Paper sx={{ p: 3, mb: 3 }} elevation={3}>
      <Typography variant="h6" gutterBottom>
        Filter Inputs
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <TextField
            label="AWS Region"
            select
            fullWidth
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            {awsRegions.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} md={4}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(newDate) => newDate && setStartDate(newDate)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={(newDate) => newDate && setEndDate(newDate)}
            slotProps={{ textField: { fullWidth: true } }}
            minDate={startDate}
          />
        </Grid>
      </Grid>
    </Paper>
  );
}

function CostSummaryCards({
  totalCost,
  avgCost,
  uniqueServices,
}: {
  totalCost: number;
  avgCost: number;
  uniqueServices: number;
}) {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={4}>
        <Card sx={{ p: 2, background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)', color: '#fff', borderRadius: 3 }}>
          <CardContent>
            <MonetizationOnIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">Total Cost</Typography>
            <Typography variant="h5">${totalCost.toFixed(2)}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ p: 2, background: 'linear-gradient(135deg, #1e3c72, #2a5298)', color: '#fff', borderRadius: 3 }}>
          <CardContent>
            <ShowChartIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">Avg Daily Cost</Typography>
            <Typography variant="h5">${avgCost.toFixed(2)}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ p: 2, background: 'linear-gradient(135deg, #355c7d, #6c5b7b, #c06c84)', color: '#fff', borderRadius: 3 }}>
          <CardContent>
            <CategoryIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">Unique Services</Typography>
            <Typography variant="h5">{uniqueServices}</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default function Page(): React.JSX.Element {
  const { selectedAccountData } = useAwsAccount();

  const [region, setRegion] = useState<string>('us-east-1');
  const [startDate, setStartDate] = useState<Dayjs>(dayjs().subtract(180, 'day'));
  const [endDate, setEndDate] = useState<Dayjs>(dayjs());
  const [costData, setCostData] = useState<CostData | null>(null);
  const [fetching, setFetching] = useState<boolean>(false);
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    const fetchCosts = async () => {
      if (!selectedAccountData || !startDate || !endDate || !region) return;

      setFetching(true);

      try {
        const costResult = await authClient.getAwsCosts({
          accessKey: selectedAccountData.accessKey,
          secretKey: selectedAccountData.secretKey,
          region,
          start: startDate.format('YYYY-MM-DD'),
          end: endDate.format('YYYY-MM-DD'),
        });

        setCostData(costResult.data || null);

        const serviceResult = await authClient.getAwsServiceCosts({
          accessKey: selectedAccountData.accessKey,
          secretKey: selectedAccountData.secretKey,
          region,
          start: startDate.format('YYYY-MM-DD'),
          end: endDate.format('YYYY-MM-DD'),
        });

        const serviceData = serviceResult.data;

      if (!Array.isArray(serviceData) || serviceData.length === 0) {
         console.error("Invalid service data format:", serviceData);
          setChartData(null);
          setFetching(false);
          return;
      }

        const months = serviceData.map((item: any) => item.month);

        const allServices = new Set<string>();
        serviceData.forEach((entry: Record<string, number | string>) => {
          Object.keys(entry).forEach((key) => {
            if (key !== 'month') {
              allServices.add(key);
            }
          });
        });

        const chartDataFormatted: Record<string, number[]> = {};
        [...allServices].forEach((service) => {
          chartDataFormatted[service] = serviceData.map((entry) => Number(entry[service] || 0));
        });

        const datasets = [...allServices].map((service, index) => ({
          label: service,
          data: chartDataFormatted[service],
          backgroundColor: `hsl(${(index * 35) % 360}, 70%, 55%)`,
          stack: 'stack1',
        }));

        setChartData({ labels: months, datasets });

      } catch (error) {
        console.error('Error fetching AWS cost data:', error);
        setCostData(null);
        setChartData(null);
      } finally {
        setFetching(false);
      }
    };

    fetchCosts();
  }, [region, startDate, endDate, selectedAccountData]);

  return (
    <Box sx={{ p: 2 }}>
      <FilterInputs
        region={region}
        setRegion={setRegion}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
      />

      {fetching ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : costData ? (
        <>
          <CostSummaryCards
            totalCost={costData.total_cost}
            avgCost={costData.average_cost}
            uniqueServices={costData.unique_services}
          />

          {chartData ? (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Monthly Service-wise Cost Breakdown
              </Typography>
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'bottom' },
                    tooltip: { mode: 'index', intersect: false },
                  },
                  interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false,
                  },
                  scales: {
                    x: { stacked: true },
                    y: { stacked: true },
                  },
                }}
              />
            </Box>
          ) : (
            <Typography>No service cost data available.</Typography>
          )}
        </>
      ) : (
        <Typography variant="body1" sx={{ mt: 4 }}>
          No data available.
        </Typography>
      )}
    </Box>
  );
}
