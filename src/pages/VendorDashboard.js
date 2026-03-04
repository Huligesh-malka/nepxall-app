import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Chip,
  CircularProgress,
  Alert
} from "@mui/material";
import { userAPI } from "../api/api";
import { useNavigate } from "react-router-dom";

const VendorDashboard = () => {

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  /* ================= ROLE PROTECTION ================= */
  useEffect(() => {
    if (role !== "vendor") {
      navigate("/");
    }
  }, [role, navigate]);

  /* ================= FETCH SERVICES ================= */

  const fetchServices = async () => {
    try {

      const res = await userAPI.get("/vendor/services");

      setServices(res.data.services || []);

    } catch (err) {

      console.error(err);
      setError("Failed to load services");

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  /* ================= UPDATE STATUS ================= */

  const updateStatus = async (id, status) => {
    try {

      await userAPI.put(`/vendor/services/${id}/status`, {
        vendor_status: status
      });

      fetchServices();

    } catch {

      alert("Failed to update status");

    }
  };

  /* ================= STATUS COLOR ================= */

  const getStatusColor = (status) => {

    switch (status) {

      case "approved":
        return "info";

      case "in_progress":
        return "warning";

      case "completed":
        return "success";

      case "cancelled":
        return "error";

      default:
        return "default";
    }
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );
  }

  return (

    <Box p={3}>

      <Typography variant="h4" mb={3}>
        Vendor Dashboard
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {services.length === 0 ? (

        <Alert severity="info">
          No assigned services yet.
        </Alert>

      ) : (

        <Paper sx={{ overflowX: "auto" }}>

          <Table>

            <TableHead>

              <TableRow>

                <TableCell><strong>Service</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Customer</strong></TableCell>
                <TableCell><strong>Address</strong></TableCell>
                <TableCell><strong>Amount</strong></TableCell>
                <TableCell><strong>Commission</strong></TableCell>
                <TableCell><strong>Earnings</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Action</strong></TableCell>

              </TableRow>

            </TableHead>

            <TableBody>

              {services.map((s) => {

                const earnings = (s.amount || 0) - (s.commission || 0);

                return (

                  <TableRow key={s.id}>

                    <TableCell>{s.service_type}</TableCell>

                    <TableCell>{s.service_date}</TableCell>

                    <TableCell>
                      {s.tenant_name || s.user_name || "Customer"}
                    </TableCell>

                    <TableCell>{s.address || "-"}</TableCell>

                    <TableCell>₹{s.amount}</TableCell>

                    <TableCell>₹{s.commission}</TableCell>

                    <TableCell>
                      <strong>₹{earnings}</strong>
                    </TableCell>

                    <TableCell>

                      <Chip
                        label={s.vendor_status}
                        color={getStatusColor(s.vendor_status)}
                        size="small"
                      />

                    </TableCell>

                    <TableCell>

                      {s.vendor_status === "approved" && (

                        <Button
                          size="small"
                          variant="contained"
                          onClick={() =>
                            updateStatus(s.id, "in_progress")
                          }
                        >
                          Start
                        </Button>

                      )}

                      {s.vendor_status === "in_progress" && (

                        <Button
                          size="small"
                          color="success"
                          variant="contained"
                          onClick={() =>
                            updateStatus(s.id, "completed")
                          }
                        >
                          Complete
                        </Button>

                      )}

                    </TableCell>

                  </TableRow>

                );
              })}

            </TableBody>

          </Table>

        </Paper>

      )}

    </Box>
  );
};

export default VendorDashboard;