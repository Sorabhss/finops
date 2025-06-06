'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { authClient } from '@/lib/auth/client';
import type { AwsAccount } from '@/lib/auth/client';

interface AwsAccountContextType {
  accounts: AwsAccount[];
  selectedAccount: string;
  selectedAccountData: AwsAccount | null;  // added full selected account object
  setSelectedAccount: (accountId: string) => void;
  loading: boolean;
}

const AwsAccountContext = createContext<AwsAccountContextType | undefined>(undefined);

export const AwsAccountProvider = ({ children }: { children: React.ReactNode }) => {
  const [accounts, setAccounts] = useState<AwsAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      const { awsAccounts } = await authClient.getAwsAccounts();
      if (awsAccounts && awsAccounts.length > 0) {
        setAccounts(awsAccounts);
        setSelectedAccount(awsAccounts[0].id);
      }
      setLoading(false);
    };
    fetchAccounts();
  }, []);

  // Get the full account object of the selected account id, or null if not found
  const selectedAccountData = accounts.find(acc => acc.id === selectedAccount) || null;

  return (
    <AwsAccountContext.Provider value={{ accounts, selectedAccount, selectedAccountData, setSelectedAccount, loading }}>
      {children}
    </AwsAccountContext.Provider>
  );
};

export const useAwsAccount = (): AwsAccountContextType => {
  const context = useContext(AwsAccountContext);
  if (!context) {
    throw new Error('useAwsAccount must be used within AwsAccountProvider');
  }
  return context;
};
