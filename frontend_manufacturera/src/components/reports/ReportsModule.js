import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import ManufacturingDashboard from '../ManufacturingDashboard';
import ManagementDashboard from '../ManagementDashboard';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const ReportsModule = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="informes tabs">
          <Tab label="Dashboard de Fabricación" {...a11yProps(0)} />
          <Tab label="Dashboard Gerencial" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <ManufacturingDashboard />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <ManagementDashboard />
      </TabPanel>
    </Box>
  );
};

export default ReportsModule;
