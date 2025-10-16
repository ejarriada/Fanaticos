import { createTheme } from '@mui/material/styles';

// A custom theme for this app
const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32',
    },
    secondary: {
      main: '#66BB6A',
    },
    error: {
      main: '#f44336',
    },
    background: {
      default: '#fff',
    },
  },
  components: {
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '56px !important',
          height: '56px',
          paddingTop: '0 !important',
          paddingBottom: '0 !important',
          '@media (min-width: 0px)': {
            minHeight: '56px !important',
            paddingTop: '0 !important',
            paddingBottom: '0 !important',
          },
          '@media (min-width: 600px)': {
            minHeight: '56px !important',
            paddingTop: '0 !important',
            paddingBottom: '0 !important',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          height: '56px',
          minHeight: '56px',
        },
      },
    },
  },
});

export default theme;