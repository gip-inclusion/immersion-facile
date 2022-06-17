import React from "react";
import { Box, Tabs as MuiTabs, Tab, Typography } from "@mui/material";

type TabPanelProps = {
  children?: React.ReactNode;
  index: number;
  value: number;
};

const TabPanel = (props: TabPanelProps) => {
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
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
};

export type TabsProperties = {
  content: Record<string, React.ReactNode>;
};

export const Tabs = ({ content }: TabsProperties) => {
  const [value, setValue] = React.useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <MuiTabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
        >
          {Object.keys(content).map((label, index) => (
            <Tab label={label} key={`tab-${index}`} />
          ))}
        </MuiTabs>
      </Box>
      {Object.values(content).map((reactNode, index) => (
        <TabPanel value={value} index={index} key={`pannel-${index}`}>
          {reactNode}
        </TabPanel>
      ))}
    </Box>
  );
};
