'use client';
import * as React from 'react';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { useState, useEffect } from 'react';
import {
  Container,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';
import { useAwsAccount } from '@/contexts/AwsAccountContext';
import { authClient } from '@/lib/auth/client';
import { AwsTagMonthlyCostRecord } from '@/lib/auth/client'; // adjust path if needed
import { saveAs } from 'file-saver'; // also install with: npm install file-saver
import { Button } from '@mui/material';
import * as XLSX from 'xlsx-js-style'; // instead of 'xlsx'


interface GroupedMonthlyCost {
  month: string;
  [service: string]: string | number;
}

export default function Page(): React.JSX.Element {
  const { selectedAccountData } = useAwsAccount();

  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));

  const [tagKeys, setTagKeys] = useState<string[]>([]);
  const [tagValues, setTagValues] = useState<Record<string, string[]>>({});

  const [selectedTagKeys, setSelectedTagKeys] = useState<string[]>([]);
  const [selectedTagValues, setSelectedTagValues] = useState<Record<string, string[]>>({});

  const [loadingTags, setLoadingTags] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);

  const [costLoading, setCostLoading] = useState(false);
  const [costError, setCostError] = useState<string | null>(null);

  // Store cost data fetched from API
  const [costData, setCostData] = useState<{ service: string; cost: number }[]>([]);
  
  const [monthlyCostData, setMonthlyCostData] = useState<AwsTagMonthlyCostRecord[]>([]);
  const [totalCost, setTotalCost] = useState<number>(0);

  const monthMap: { [month: string]: { [service: string]: number | string } } = {};
  interface GroupedMonthlyCost {
    month: string;
    [service: string]: string | number;
  }
  
  const [monthTransformedData, setMonthTransformedData] = useState<GroupedMonthlyCost[]>([]);


  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c', '#d0ed57',
    '#8dd1e1', '#83a6ed', '#8a2be2', '#00c49f', '#ff8042', '#ffbb28',
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#aa46be', '#29b6f6'
  ];
  
  const getColor = (index: number) => {
    return colors[index % colors.length];
  };
  


  // Controlled open state for Tag Keys select and tag values selects separately
  const [openTagKeysSelect, setOpenTagKeysSelect] = useState(false);
  const [openTagValueSelect, setOpenTagValueSelect] = useState<Record<string, boolean>>({});

  const exportToExcel = () => {
    if (!selectedAccountData || costData.length === 0) return;
  
    const accountId = selectedAccountData.id || 'unknown_id';
    const accountName = selectedAccountData.name || 'unknown_name';
    const totalCost = costData.reduce((sum, item) => sum + Number(item.cost), 0);
  
    const fileName = `AWS_Costs_${accountId}_${accountName}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
  
    const headingRow = [`AWS Cost Details: ${accountName} (${accountId})`, ''];
  
    const tagKeyValuePairs = selectedTagKeys.map(key => {
      const value = selectedTagValues[key] || 'N/A';
      return `${key}=${value}`;
    }).join(', ');
  
    const metaRow1 = [`Start Date: ${startDate}`, `End Date: ${endDate}`];
    const metaRow2 = [`Selected Tags:`, tagKeyValuePairs || 'None'];
  
    const headers = ['Service', 'Cost (USD)'];
    const costRows = costData.map(item => [item.service, item.cost]);
    const totalRow = ['Total', totalCost.toFixed(2)];
  
    const worksheetData = [
      headingRow,
      metaRow1,
      metaRow2,
      headers,
      ...costRows,
      totalRow,
    ];
  
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
    // Merge heading row across 2 columns
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    ];
  
    // Apply formatting
    const range = XLSX.utils.decode_range(worksheet['!ref'] || '');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cellAddress]) continue;
  
        const isHeading = R === 0;
        const isMeta = R === 1 || R === 2;
        const isHeaderRow = R === 3;
        const isTotalRow = R === worksheetData.length - 1;
  
        worksheet[cellAddress].s = {
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
          },
          font: {
            bold: isHeading || isMeta || isHeaderRow || isTotalRow,
          },
          alignment: {
            vertical: 'center',
            horizontal: 'left',
            wrapText: true,
          },
        };
      }
    }
  
    worksheet['!cols'] = [
      { wch: 50 },
      { wch: 30 },
    ];
  
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AWS Service Cost');
  
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx',
      type: 'array',
      cellStyles: true,});
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  
    saveAs(blob, fileName);
  };
  
  
  // Fetch tags and values on account or date change
  useEffect(() => {
    const fetchTagsAndValues = async () => {
      if (!selectedAccountData || !startDate || !endDate) return;

      setLoadingTags(true);
      setTagError(null);

      try {
        const { tagKeys: fetchedTagKeys, error: keysError } = await authClient.getAvailableTags({
          accessKey: selectedAccountData.accessKey,
          secretKey: selectedAccountData.secretKey,
          region: 'us-east-1',
          start: startDate,
          end: endDate,
        });

        if (keysError) throw new Error(keysError);
        if (!fetchedTagKeys || fetchedTagKeys.length === 0) {
          setTagKeys([]);
          setTagValues({});
          setLoadingTags(false);
          return;
        }

        setTagKeys(fetchedTagKeys);

        const valuesPromises = fetchedTagKeys.map(async (key) => {
          const { tagValues, error: valuesError } = await authClient.getTagValues({
            accessKey: selectedAccountData.accessKey,
            secretKey: selectedAccountData.secretKey,
            region: 'us-east-1',
            start: startDate,
            end: endDate,
            tagKey: key,
          });
          if (valuesError) throw new Error(valuesError);
          return { key, values: tagValues || [] };
        });

        const valuesResults = await Promise.all(valuesPromises);

        const newTagValues: Record<string, string[]> = {};
        valuesResults.forEach(({ key, values }) => {
          newTagValues[key] = values;
        });

        setTagValues(newTagValues);
      } catch (error: any) {
        setTagError(error.message || 'Failed to fetch tags');
        setTagKeys([]);
        setTagValues({});
      } finally {
        setLoadingTags(false);
      }
    };

    fetchTagsAndValues();
  }, [selectedAccountData]);

  // Fetch costs when tags or date/account selections change
  useEffect(() => {
    const fetchCostsByTags = async () => {
      if (
        !selectedAccountData ||
        !startDate ||
        !endDate ||
        selectedTagKeys.length === 0
      ) {
        setCostData([]);
        setMonthlyCostData([]);
        setMonthTransformedData([])
        return;
      }

      // Prepare tag filters for the request:
      // only include tag keys that have selected values (non-empty arrays)
      const filteredTags: Record<string, string[]> = {};
      for (const key of selectedTagKeys) {
        const values = selectedTagValues[key];
        if (values && values.length > 0) {
          filteredTags[key] = values;
        }
      }

      setCostLoading(true);
      setCostError(null);

      try {
        console.log(filteredTags)
        const { data, error } = await authClient.getAwsCostsByTags({
          accessKey: selectedAccountData.accessKey,
          secretKey: selectedAccountData.secretKey,
          region: 'us-east-1',
          start: startDate,
          end: endDate,
          tag_filters: filteredTags,
        });

        const { data: monthlyCostData, error: month_error } = await authClient.getAwsCostsByTagsMonthly({
          accessKey: selectedAccountData.accessKey,
          secretKey: selectedAccountData.secretKey,
          region: 'us-east-1',
          start: startDate,
          end: endDate,
          tag_filters: filteredTags,
        });
        
        console.log('month data')
        console.log(monthlyCostData)

        if (error) throw new Error(error);

        // Expecting your API to return something like:
        // { costByService: [{service: string, cost: number}], monthlyCosts: [{month:string, EC2:number, ...}] }
        // Adjust this part if your API response format differs
        console.log(data)
        if (data && Array.isArray(data.service_data) && monthlyCostData && Array.isArray(monthlyCostData)) {
          // Transform from [['Service', cost]] to [{ service, cost }]
          const transformedData = data.service_data.map(
            ([service, cost]: [string, number]) => ({ service, cost })
          );

          
          const monthMap: { [month: string]: GroupedMonthlyCost } = {};

          monthlyCostData.forEach(({ Month, Service, Cost }) => {
            if (!monthMap[Month]) {
              // Make sure the object starts with the required `month` key
              monthMap[Month] = { month: Month };
            }
            monthMap[Month][Service] = Cost;
          });
        
          const transformed = Object.values(monthMap);
        
          // ✅ Now it's safe to set the state
          setMonthTransformedData(transformed);

          //monthtransformedData = Object.values(monthMap);
          //console.log('month data')
         // console.log(monthtransformedData)
                  
          setCostData(transformedData);
          setMonthlyCostData(monthlyCostData); // If you add monthly data later, populate here
        } else {
          setCostData([]);
          setMonthlyCostData([]);
          setMonthTransformedData([])
        }
      } catch (error: any) {
        setCostError(error.message || 'Failed to fetch cost data');
        setCostData([]);
        setMonthlyCostData([]);
        setMonthTransformedData([])
      } finally {
        setCostLoading(false);
      }
    };

    fetchCostsByTags();
  }, [selectedTagKeys, selectedTagValues, startDate, endDate, selectedAccountData]);

  // Handlers for tag keys and values selection

  const handleTagKeysChange = (event: any) => {
    setSelectedTagKeys(event.target.value);
    setOpenTagKeysSelect(false);

    // Reset selected tag values when tag keys change
    setSelectedTagValues({});
  };

  const handleTagKeysOpen = () => setOpenTagKeysSelect(true);
  const handleTagKeysClose = () => setOpenTagKeysSelect(false);

  const handleTagValueChange = (key: string, values: string[]) => {
    setSelectedTagValues((prev) => ({ ...prev, [key]: values }));
    setOpenTagValueSelect((prev) => ({ ...prev, [key]: false }));
  };

  const handleOpenTagValueSelect = (key: string) => {
    setOpenTagValueSelect((prev) => ({ ...prev, [key]: true }));
  };

  const handleCloseTagValueSelect = (key: string) => {
    setOpenTagValueSelect((prev) => ({ ...prev, [key]: false }));
  };

  // Calculate total cost from current cost data
  const getTotalCost = () =>
    costData.reduce((sum, service) => sum + service.cost, 0);

  const inputStyle = {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(8px)',
    borderRadius: 2,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      '& fieldset': {
        borderColor: '#90caf9',
      },
      '&:hover fieldset': {
        borderColor: '#42a5f5',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#1e88e5',
      },
      '& input': {
        color: '#0d47a1',
      },
    },
    '& .MuiInputLabel-root': {
      color: '#1976d2',
    },
  };

  return (
    <Container maxWidth="xl" sx={{ py: 0 }}>
      {/* Filters Section */}
      <Box component={Paper} elevation={3} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={inputStyle}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={inputStyle}
            />
          </Grid>
  
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth sx={inputStyle}>
              <InputLabel>Tag Keys</InputLabel>
              <Select
                multiple
                value={selectedTagKeys}
                onChange={handleTagKeysChange}
                open={openTagKeysSelect}
                onOpen={handleTagKeysOpen}
                onClose={handleTagKeysClose}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {tagKeys.map((key) => (
                  <MenuItem key={key} value={key}>
                    {key}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
  
          {selectedTagKeys.map((key) => (
            <Grid item xs={12} sm={6} md={3} key={key}>
              <FormControl fullWidth sx={inputStyle}>
                <InputLabel>{key} Values</InputLabel>
                <Select
                  multiple
                  value={selectedTagValues[key] || []}
                  onChange={(e) =>
                    handleTagValueChange(key, e.target.value as string[])
                  }
                  open={openTagValueSelect[key] || false}
                  onOpen={() => handleOpenTagValueSelect(key)}
                  onClose={() => handleCloseTagValueSelect(key)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                >
                  {loadingTags && (!tagValues[key] || tagValues[key].length === 0) ? (
  <MenuItem disabled>
    <CircularProgress size={20} />
    <span style={{ marginLeft: '8px' }}>Loading...</span>
  </MenuItem>
) : (
  (tagValues[key] || []).map((value) => (
    <MenuItem key={value} value={value}>
      {value}
    </MenuItem>
  ))
)}

                </Select>
              </FormControl>
            </Grid>
          ))}
        </Grid>
      </Box>
  
      {/* Total Cost Summary */}
      {costLoading ? (
        <CircularProgress />
      ) : (
        <Box component={Paper} elevation={3} sx={{ mb: 4, p: 3, borderRadius: 3, textAlign: 'center' }}>
          <Typography variant="h5">Total Cost</Typography>
          <Typography variant="h4" color="primary" fontWeight="bold">
            ${getTotalCost().toFixed(2)}
          </Typography>
        </Box>
      )}

      {/* Service Cost Cards */}
{costLoading ? (
  <Box display="flex" justifyContent="center" my={4}>
    <CircularProgress />
  </Box>
) : (
  <Grid container spacing={2} sx={{ mb: 4 }}>
    {costData.map((serviceCost, index) => (
      <Grid item xs={12} sm={6} md={4} lg={3} key={serviceCost.service}>
        <Paper
          elevation={4}
          sx={{
            p: 2,
            borderRadius: 3,
            background: 'linear-gradient(to right, #e3f2fd, #bbdefb)',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
          }}
        >
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            color="primary"
            gutterBottom
            noWrap
          >
            {serviceCost.service}
          </Typography>
          <Typography variant="h6" fontWeight="bold" color="text.secondary">
            ${serviceCost.cost.toFixed(2)}
          </Typography>
        </Paper>
      </Grid>
    ))}
  </Grid>
)}
  
     {/* Monthly Bar Chart */}
<Box component={Paper} elevation={3} sx={{ p: 3, mt: 4, borderRadius: 3 }}>
  <Typography variant="h6" gutterBottom>
    Monthly Cost by Service
  </Typography>

  {costLoading ? (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
      <CircularProgress />
    </Box>
  ) : monthTransformedData.length === 0 ? (
    <Typography variant="body1">No data available for selected filters.</Typography>
  ) : (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={monthTransformedData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        {Object.keys(monthTransformedData[0])
          .filter((key) => key !== 'month')
          .map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="a"
              fill={getColor(index)}
              name={key}
            />
          ))}
      </BarChart>
    </ResponsiveContainer>
  )}
</Box>

<Grid item xs={12} sx={{ paddingTop: 2, paddingRight: 2 }} className="flex justify-end">
  {costData.length > 0 && (
    <Button
      variant="contained"
      color="primary"
      onClick={exportToExcel}
    >
      Export to Excel
    </Button>
  )}
</Grid>


    </Container>
  );  
}

function getColorByIndex(idx: number) {
  // Some bright distinct colors to differentiate bars
  const colors = [
    '#1976d2',
    '#388e3c',
    '#f57c00',
    '#7b1fa2',
    '#d32f2f',
    '#00796b',
    '#512da8',
    '#c2185b',
    '#303f9f',
  ];
  return colors[idx % colors.length];
}