import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  Code,
  Storage,
  Cloud,
  Monitor,
  Memory,
  Hub,
} from '@mui/icons-material';

interface TechItem {
  name: string;
  version: string;
}

interface TechCategory {
  title: string;
  icon: React.ReactElement;
  color: string;
  items: TechItem[];
}

const techStack: TechCategory[] = [
  {
    title: 'Frontend',
    icon: <Monitor />,
    color: '#667eea',
    items: [
      { name: 'React', version: '19.2' },
      { name: 'TypeScript', version: '5.9' },
      { name: 'Vite', version: '7.2' },
      { name: 'MUI', version: '7.3' },
      { name: 'React Router', version: '7.11' },
      { name: 'Axios', version: '1.13' },
      { name: 'Day.js', version: '1.11' },
    ],
  },
  {
    title: 'Backend (.NET)',
    icon: <Code />,
    color: '#764ba2',
    items: [
      { name: '.NET', version: '10.0' },
      { name: 'Entity Framework', version: '10.0' },
      { name: 'YARP Proxy', version: '2.3' },
      { name: 'MassTransit', version: '8.5' },
      { name: 'Serilog', version: '10.0' },
      { name: 'Polly', version: '8.6' },
    ],
  },
  {
    title: 'Backend (Node.js)',
    icon: <Code />,
    color: '#43e97b',
    items: [
      { name: 'Express', version: '4.18' },
      { name: 'Mongoose', version: '8.0' },
      { name: 'Winston', version: '3.11' },
      { name: 'amqplib', version: '0.10' },
    ],
  },
  {
    title: 'Databases',
    icon: <Storage />,
    color: '#f5576c',
    items: [
      { name: 'SQL Server', version: '2022' },
      { name: 'MongoDB', version: '7' },
      { name: 'Redis', version: '7' },
    ],
  },
  {
    title: 'Messaging & Discovery',
    icon: <Hub />,
    color: '#ff9a44',
    items: [
      { name: 'RabbitMQ', version: '3' },
      { name: 'Consul', version: '1.7' },
    ],
  },
  {
    title: 'Observability',
    icon: <Memory />,
    color: '#4facfe',
    items: [
      { name: 'OpenTelemetry', version: '1.14' },
      { name: 'Jaeger', version: 'latest' },
      { name: 'Prometheus', version: 'latest' },
      { name: 'Grafana', version: 'latest' },
      { name: 'Seq', version: 'latest' },
    ],
  },
  {
    title: 'Infrastructure',
    icon: <Cloud />,
    color: '#38f9d7',
    items: [
      { name: 'Docker', version: 'Compose' },
      { name: 'Nginx', version: 'Alpine' },
    ],
  },
];

const About: React.FC = () => {
  return (
    <Box sx={{ width: '100%' }}>
      <Typography
        variant="h4"
        fontWeight={600}
        mb={1}
        sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' } }}
      >
        About MedFlow
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        A microservices-based healthcare management platform
      </Typography>

      <Grid container spacing={2}>
        {techStack.map((category) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={category.title}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                height: '100%',
                borderTop: `3px solid ${category.color}`,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                <Box sx={{ color: category.color, display: 'flex' }}>
                  {category.icon}
                </Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {category.title}
                </Typography>
              </Stack>
              <Divider sx={{ mb: 1.5 }} />
              <Stack direction="row" flexWrap="wrap" gap={0.75} useFlexGap>
                {category.items.map((item) => (
                  <Chip
                    key={item.name}
                    label={`${item.name} ${item.version}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                ))}
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={2} sx={{ p: 2, mt: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={1}>
          Architecture
        </Typography>
        <Divider sx={{ mb: 1.5 }} />
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            MedFlow uses a microservices architecture with 4 backend services:
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75} useFlexGap>
            <Chip label="API Gateway (YARP)" size="small" color="primary" />
            <Chip label="Patient Service (.NET)" size="small" color="secondary" />
            <Chip label="Appointment Service (Node.js)" size="small" color="success" />
            <Chip label="Billing Service (.NET)" size="small" color="warning" />
            <Chip label="Notification Service (.NET)" size="small" color="info" />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Services communicate via RabbitMQ events, use Redis for caching, and are
            monitored through OpenTelemetry, Jaeger, Prometheus, and Grafana.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default About;
