import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Event,
  Receipt,
  Notifications,
  LocalHospital,
  Logout,
  Brightness4,
  Brightness7,
  Info,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { API_CONFIG } from '../../config/api';

const DRAWER_WIDTH = 240;

interface NavItem {
  text: string;
  icon: React.ReactElement;
  path: string;
}

const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout, isAdmin } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const patientNavItems: NavItem[] = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/patient' },
    { text: 'Appointments', icon: <Event />, path: '/patient/appointments' },
    { text: 'Invoices', icon: <Receipt />, path: '/patient/invoices' },
    { text: 'Notifications', icon: <Notifications />, path: '/patient/notifications' },
    { text: 'About', icon: <Info />, path: '/patient/about' },
  ];

  const adminNavItems: NavItem[] = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/admin' },
    { text: 'Patients', icon: <People />, path: '/admin/patients' },
    { text: 'Appointments', icon: <Event />, path: '/admin/appointments' },
    { text: 'Billing', icon: <Receipt />, path: '/admin/billing' },
    { text: 'About', icon: <Info />, path: '/admin/about' },
  ];

  const navItems = isAdmin ? adminNavItems : patientNavItems;

  const drawer = (
    <div>
      <Toolbar>
        <LocalHospital sx={{ color: 'primary.main', mr: 1 }} />
        <Typography variant="h6" noWrap component="div">
          MedFlow
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => { navigate(item.path); setMobileOpen(false); }}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {isAdmin ? 'MedFlow Admin' : 'MedFlow Portal'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={toggleTheme} color="inherit" title="Toggle dark mode">
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
            <Typography variant="body2" sx={{ display: { xs: 'none', md: 'block' } }}>{user?.email}</Typography>
            <IconButton onClick={handleMenuOpen} color="inherit">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user?.email.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        {API_CONFIG.DEMO_MODE && (
          <Box
            sx={{
              bgcolor: 'info.main',
              color: 'info.contrastText',
              textAlign: 'center',
              py: 0.75,
              px: 2,
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            Demo Mode — This is a read-only demo. Data modifications are disabled.
          </Box>
        )}
        <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
