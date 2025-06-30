/**
 * Frontend Connectivity Test
 * Add this to test if frontend can reach backend
 */

// Test function that can be called from browser console
window.testBackendConnectivity = async function() {
  
  const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:3001/api';
  
  try {
    const response = await fetch(`${apiUrl}/auth/validate`);
    const data = await response.json();
    
    
    if (response.status === 401 && data.error === 'Access token required') {
      return { success: true, message: 'Backend connection OK' };
    } else {
      return { success: false, message: 'Unexpected response' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Auto-run test

export default {};
