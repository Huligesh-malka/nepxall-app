import React from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Paper } from "@mui/material";

const CreatePlan = () => {
  const { propertyId } = useParams();

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Create Membership Plan
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography>
          Building plan for property ID: <b>{propertyId}</b>
        </Typography>
        {/* Plan form will go here */}
      </Paper>
    </Box>
  );
};

export default CreatePlan;