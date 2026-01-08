export interface HealthResponse {
  status: string;
  timestamp: string;
  provider: {
    name: string;
    model: string;
  };
  mcp: {
    connected: boolean;
    tools: string[];
  };
}

export const fetchHealth = async (): Promise<HealthResponse | null> => {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) {
      throw new Error('Failed to fetch health');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching health:', error);
    return null;
  }
};
