export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  storageUsedBytes: number;
  storageQuotaBytes: number;
  subscriptionStatus: 'free' | 'active' | 'cancelled';
}

export interface Upload {
  id: string;
  filename: string;
  fileSizeBytes: number;
  uploadedAt: string;
  expiresAt: string;
  downloadCount: number;
  status: 'pending' | 'active' | 'deleted';
}

export interface Payment {
  id: string;
  amount: number;
  paymentType: 'one_time' | 'subscription';
  status: 'pending' | 'succeeded' | 'failed';
  createdAt: string;
}
