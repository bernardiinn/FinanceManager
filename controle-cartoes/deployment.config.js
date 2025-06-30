/**
 * Deployment Configuration for VM Setup
 * Initial Deploy Version: v0.1-initial
 */

const deploymentConfig = {
  // Current deployment settings
  ENVIRONMENT: 'vm-internal',
  VERSION: 'v0.1-initial',
  ACCESS_MODE: 'ip-only', // future = domain
  
  // Server configuration
  FRONTEND_HOST: '0.0.0.0',
  FRONTEND_PORT: 5173,
  BACKEND_HOST: '0.0.0.0',
  BACKEND_PORT: 3001,
  
  // Future domain configuration (placeholder)
  FUTURE_DOMAIN: null, // Will be set when domain is configured
  
  // VM-specific settings
  VM_MODE: true,
  EXTERNAL_ACCESS: true,
  
  // Required firewall ports
  REQUIRED_PORTS: [5173, 3001],
  
  // Build the base URL dynamically
  getBaseUrl: (vmIp = null) => {
    if (process.env.APP_DOMAIN) {
      return process.env.APP_DOMAIN;
    }
    if (vmIp) {
      return `http://${vmIp}:${deploymentConfig.FRONTEND_PORT}`;
    }
    return `http://localhost:${deploymentConfig.FRONTEND_PORT}`;
  },
  
  // Get API URL
  getApiUrl: (vmIp = null) => {
    if (process.env.API_DOMAIN) {
      return process.env.API_DOMAIN;
    }
    if (vmIp) {
      return `http://${vmIp}:${deploymentConfig.BACKEND_PORT}`;
    }
    return `http://localhost:${deploymentConfig.BACKEND_PORT}`;
  }
};

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = deploymentConfig;
} else if (typeof window !== 'undefined') {
  window.deploymentConfig = deploymentConfig;
}

export default deploymentConfig;
