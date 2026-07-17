export const authLog = (stage: string, message: string, data?: any) => {
  if (typeof window === 'undefined') return;
  
  const payload = {
    // ✅ Fix: Use random + time to guarantee uniqueness
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toLocaleTimeString(),
    stage,
    message,
    data: data ? JSON.stringify(data, null, 2) : null
  };

  console.log(`[${stage}] ${message}`, data || '');
  
  window.dispatchEvent(new CustomEvent('shadow-auth-debug', { 
    detail: payload 
  }));
};