import { Box, Typography } from "@mui/material";
import React, { useState } from 'react';

const AdminUsers = () => {
  const [selected, setSelected] = useState('first');

  const userData = [
    {
      id: 1,
      name: 'Sharvesh',
      email: 'sharvesh@gmail.com',
      phone_no: '999234211',
      acc_created: '12th Dec 2024',
      last_login: '31th Dec 2024'
    },
    {
      id: 2,
      name: 'Harish',
      email: 'harishh@gmail.com',
      phone_no: '3232234211',
      acc_created: '10th Dec 2024',
      last_login: '21th Dec 2024'
    },
  ];

  const vendorData = [
    {
      id: 1,
      name: 'SJK',
      email: 'sjkh@gmail.com',
      phone_no: '1234567890',
      acc_created: '12th Jun 2024',
      last_login: '31th Jun 2024'
    },
    {
      id: 2,
      name: 'adas',
      email: 'dfasddf@gmail.com',
      phone_no: '3224342424',
      acc_created: '10th Apr 2024',
      last_login: '21th Apr 2024'
    },
  ];

  return (
    <div>
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {/* Navigation */}
        <Box sx={{ display: 'flex', width: '60%', margin: '0 auto', justifyContent: 'space-between' }}>
          <Box>
            <Typography
              onClick={() => setSelected('first')}
              sx={{
                cursor: 'pointer',
                fontFamily: 'albert sans',
                fontSize: '25px',
                fontWeight: '800',
                color: selected === 'first' ? '#000' : '#aaa'
              }}
            >
              Recent Users
            </Typography>
            {selected === 'first' && (
              <Box sx={{ height: '2px', backgroundColor: '#000', width: '100%', marginTop: '2px' }} />
            )}
          </Box>

          <Box>
            <Typography
              onClick={() => setSelected('second')}
              sx={{
                cursor: 'pointer',
                fontFamily: 'albert sans',
                fontSize: '25px',
                fontWeight: '800',
                color: selected === 'second' ? '#000' : '#aaa'
              }}
            >
              Recent Vendors
            </Typography>
            {selected === 'second' && (
              <Box sx={{ height: '2px', backgroundColor: '#000', width: '100%', marginTop: '2px' }} />
            )}
          </Box>
        </Box>

        {/* Main Line */}
        <Box sx={{ height: '1px', backgroundColor: 'rgba(238, 237, 242, 1)', width: '100%', marginTop: '2%' }} />

        {/* Content */}
        <Box sx={{ width: '90%', margin: '3% auto 0 auto' }}>
          {selected === 'first' ? (
            <Box
              sx={{
                mt: "1%",
                borderRadius: "10px",
                backgroundColor: "rgba(248, 247, 250, 1)",
                boxSizing: "border-box",
                height: "auto",
                width: "100%",
                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                overflowX: 'auto'
              }}
            >
              {/* Table Headers */}
              <Box sx={{
                display: "flex",
                padding: "1% 2%",
                backgroundColor: "#f4f4f7",
                borderTopLeftRadius: '10px',
                borderTopRightRadius: '10px',
                boxSizing: 'border-box'
              }}>
                {["User name", "Email", "Phone Number", "Account Created", "Last Login"].map((header, index) => (
                  <Typography
                    key={index}
                    sx={{
                      width: "20%",
                      fontWeight: "600",
                      fontFamily: 'Albert Sans',
                      textAlign: "center"
                    }}
                  >
                    {header}
                  </Typography>
                ))}
              </Box>

              {/* Data Rows */}
              {userData.map((user) => (
                <Box
                  key={user.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    padding: "2% 2%",
                    borderTop: "1px solid #dcdcdc",
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                >
                  {[user.name, user.email, user.phone_no, user.acc_created, user.last_login].map((data, index) => (
                    <Typography
                      key={index}
                      sx={{
                        width: "20%",
                        fontFamily: 'Albert Sans',
                        textAlign: "center"
                      }}
                    >
                      {data}
                    </Typography>
                  ))}
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{
              mt: "1%",
              borderRadius: "10px",
              backgroundColor: "rgba(248, 247, 250, 1)",
              boxSizing: "border-box",
              height: "auto",
              width: "100%",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              overflowX: 'auto'
            }}>
              {/* Table Headers */}
              <Box sx={{
                display: "flex",
                padding: "1% 2%",
                backgroundColor: "#f4f4f7",
                borderTopLeftRadius: '10px',
                borderTopRightRadius: '10px',
                boxSizing: 'border-box'
              }}>
                {["Vendor name", "Email", "Phone Number", "Account Created", "Last Login"].map((header, index) => (
                  <Typography
                    key={index}
                    sx={{
                      width: "20%",
                      fontWeight: "600",
                      fontFamily: 'Albert Sans',
                      textAlign: "center"
                    }}
                  >
                    {header}
                  </Typography>
                ))}
              </Box>

              {/* Data Rows */}
              {vendorData.map((vendor) => (
                <Box
                  key={vendor.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    padding: "2% 2%",
                    borderTop: "1px solid #dcdcdc",
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                >
                  {[vendor.name, vendor.email, vendor.phone_no, vendor.acc_created, vendor.last_login].map((data, index) => (
                    <Typography
                      key={index}
                      sx={{
                        width: "20%",
                        fontFamily: 'Albert Sans',
                        textAlign: "center"
                      }}
                    >
                      {data}
                    </Typography>
                  ))}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </div>
  );
};

export default AdminUsers;
