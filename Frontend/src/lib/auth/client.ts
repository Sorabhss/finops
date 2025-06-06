'use client';

import type { User } from '@/types/user';

export interface SignUpParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignInWithOAuthParams {
  provider: 'google' | 'discord';
}

export interface SignInWithPasswordParams {
  email: string;
  password: string;
}

export interface ResetPasswordParams {
  email: string;
}

export interface UpdateUserParams {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  city?: string;
  country?: string;
  timezone?: string;
}

export interface UpdatePasswordParams {
  password: string;
  confirmPassword: string;
}

export interface AwsAccount {
  id: string;
  name: string;
  accessKey: string;
  secretKey: string;
}

export interface AwsAccountCreateParams {
  name: string;
  accessKey: string;
  secretKey: string;
}

export interface AwsAccountUpdateParams {
  name?: string;
  accessKey?: string;
  secretKey?: string;
}

export interface AwsCostRequestParams {
  accessKey: string;
  secretKey: string;
  start: string;   // YYYY-MM-DD
  end: string;     // YYYY-MM-DD
  region: string;  // e.g. 'us-east-1'
}

export interface AwsCostResponse {
  total_cost: number;
  average_cost: number;
  unique_services: number;
}

export interface AwsServiceCostPerMonth {
  month: string;
  [service: string]: number | string;
}


export interface AwsTagKeyResponse {
  tagKeys: string[];
}

export interface AwsTagValueResponse {
  tagValues: string[];
}

export interface AwsTagCostRequestParams {
  accessKey: string;
  secretKey: string;
  region: string;
  start: string;
  end: string;
  tag_filters: Record<string, string[]>; // e.g., { "Environment": ["Dev", "Prod"] }
}

export interface AwsTagCostResponse {
  total_cost: number;
  service_data: [string, number][];
}


export interface AwsTagMonthlyCostRecord {
  Month: string;
  Service: string;
  Cost: number;
}

export interface AwsTagMonthlyCostResponse {
  data: AwsTagMonthlyCostRecord[];
}

export interface AwsBudgetRecord {
  Name: string;
  Thresholds: string;
  'Budget ($)': string;
  'Amount Used ($)': string;
  'Forecasted Amount ($)': string;
  'Current vs. Budgeted (%)': string;
  'Forecasted vs. Budgeted (%)': string;
}

export interface AwsBudgetRequestParams {
  accessKey: string;
  secretKey: string;
  region: string;
}

export interface AwsBudgetResponse {
  accountId: string;
  budgets: AwsBudgetRecord[];
}


class AuthClient {
  private API_BASE = 'http://localhost:5000'; // Change to your backend URL

  private getToken() {
    return localStorage.getItem('custom-auth-token');
  }

  private setToken(token: string) {
    localStorage.setItem('custom-auth-token', token);
  }

  private removeToken() {
    localStorage.removeItem('custom-auth-token');
  }

  async signUp(params: SignUpParams): Promise<{ error?: string }> {
    const res = await fetch(`${this.API_BASE}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      return { error: err.error || 'Signup failed' };
    }
    const data = await res.json();
    this.setToken(data.token);
    return {};
  }

  async signInWithOAuth(_: SignInWithOAuthParams): Promise<{ error?: string }> {
    return { error: 'Social authentication not implemented' };
  }

  async signInWithPassword(params: SignInWithPasswordParams): Promise<{ error?: string }> {
    const res = await fetch(`${this.API_BASE}/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      return { error: err.error || 'Invalid credentials' };
    }
    const data = await res.json();
    this.setToken(data.token);
    return {};
  }

  async resetPassword(_: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: 'Password reset not implemented' };
  }

  // Updated implementation for updatePassword
  async updatePassword(params: UpdatePasswordParams): Promise<{ error?: string }> {
    const token = this.getToken();
    if (!token) return { error: 'Not authenticated' };

    const res = await fetch(`${this.API_BASE}/update-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json();
      return { error: err.error || 'Failed to update password' };
    }

    return {};
  }

  async getUser(): Promise<{ data?: User | null; error?: string }> {
    const token = this.getToken();
    if (!token) return { data: null };

    const res = await fetch(`${this.API_BASE}/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return { data: null };

    const data = await res.json();
    return { data: data.data };
  }

  async updateUser(params: UpdateUserParams): Promise<{ data?: User; error?: string }> {
    const token = this.getToken();
    if (!token) return { error: 'Not authenticated' };

    const res = await fetch(`${this.API_BASE}/user`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json();
      return { error: err.error || 'Failed to update user' };
    }

    const data = await res.json();
    return { data: data.data };
  }

  async signOut(): Promise<{ error?: string }> {
    this.removeToken();
    return {};
  }

  // === AWS ACCOUNTS METHODS ===

  async getAwsAccounts(): Promise<{ awsAccounts?: AwsAccount[]; error?: string }> {
    const token = this.getToken();
    if (!token) return { error: 'Not authenticated' };

    const res = await fetch(`${this.API_BASE}/aws-accounts`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json();
      return { error: err.error || 'Failed to fetch AWS accounts' };
    }

    const data = await res.json();
    return { awsAccounts: data.awsAccounts };
  }

  async addAwsAccount(params: AwsAccountCreateParams): Promise<{ awsAccount?: AwsAccount; error?: string }> {
    const token = this.getToken();
    if (!token) return { error: 'Not authenticated' };

    const res = await fetch(`${this.API_BASE}/aws-accounts`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json();
      return { error: err.error || 'Failed to add AWS account' };
    }

    const data = await res.json();
    return { awsAccount: data.awsAccount };
  }

  async updateAwsAccount(
    accountId: string,
    params: AwsAccountUpdateParams
  ): Promise<{ awsAccount?: AwsAccount; error?: string }> {
    const token = this.getToken();
    if (!token) return { error: 'Not authenticated' };

    const res = await fetch(`${this.API_BASE}/aws-accounts/${accountId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json();
      return { error: err.error || 'Failed to update AWS account' };
    }

    const data = await res.json();
    return { awsAccount: data.awsAccount };
  }

  async deleteAwsAccount(accountId: string): Promise<{ deletedAccountId?: string; error?: string }> {
    const token = this.getToken();
    if (!token) return { error: 'Not authenticated' };

    const res = await fetch(`${this.API_BASE}/aws-accounts/${accountId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json();
      return { error: err.error || 'Failed to delete AWS account' };
    }

    const data = await res.json();
    return { deletedAccountId: data.deletedAccountId };
  }

  async getAwsCosts(params: AwsCostRequestParams): Promise<{ data?: AwsCostResponse; error?: string }> {
    const token = this.getToken();
  
    const res = await fetch(`${this.API_BASE}/api/get-costs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // Optional if not protected
      },
      body: JSON.stringify(params),
    });
  
    if (!res.ok) {
      const err = await res.json();
      return { error: err.error || 'Failed to fetch AWS costs' };
    }
  
    const data = await res.json();
    return { data };
  }

  async getAwsServiceCosts(params: AwsCostRequestParams): Promise<{ data?: AwsServiceCostPerMonth; error?: string }> {
    const token = this.getToken();
  
    const res = await fetch(`${this.API_BASE}/api/get-service-costs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // Optional if not protected
      },
      body: JSON.stringify(params),
    });
  
    if (!res.ok) {
      const err = await res.json();
      return { error: err.error || 'Failed to fetch AWS service costs' };
    }
  
    const data = await res.json();
    return { data };
  }
  

  async getAvailableTags(params: AwsCostRequestParams): Promise<{ tagKeys?: string[]; error?: string }> {
    const token = this.getToken();
  
    const res = await fetch(`${this.API_BASE}/tags/keys`, {   // updated endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });
  
    if (!res.ok) {
      const err = await res.json();
      return { error: err.error || 'Failed to fetch tag keys' };
    }
  
    const data = await res.json();
    return { tagKeys: data.tagKeys };
  }
  
  async getTagValues(params: AwsCostRequestParams & { tagKey: string }): Promise<{ tagValues?: string[]; error?: string }> {
    const token = this.getToken();
  
    // For the /tags/values endpoint, the backend expects tagKey at root level of JSON, so ensure it's sent properly.
    const { tagKey, ...restParams } = params;
  
    const res = await fetch(`${this.API_BASE}/tags/values`, {   // updated endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...restParams, tagKey }),
    });
  
    if (!res.ok) {
      const err = await res.json();
      return { error: err.error || 'Failed to fetch tag values' };
    }
  
    const data = await res.json();
    return { tagValues: data.tagValues };
  }

  async getAwsCostsByTags(params: AwsTagCostRequestParams): Promise<{ data?: AwsTagCostResponse; error?: string }> {
    const token = this.getToken();
  
    const res = await fetch(`${this.API_BASE}/get-cost-by-tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // Optional depending on your backend setup
      },
      body: JSON.stringify(params),
    });
  
    if (!res.ok) {
      const err = await res.json();
      return { error: err.error || 'Failed to fetch tag-based costs' };
    }
  
    const data = await res.json();
    return { data };
  }  
  
  async getAwsCostsByTagsMonthly(params: AwsTagCostRequestParams): Promise<{ data?: AwsTagMonthlyCostRecord[]; error?: string }> {
    const token = this.getToken();
  
    const res = await fetch(`${this.API_BASE}/get-cost-by-tags-months`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // Optional based on your backend auth
      },
      body: JSON.stringify(params),
    });
  
    if (!res.ok) {
      const err = await res.json();
      return { error: err.error || 'Failed to fetch AWS monthly costs by tags' };
    }
  
    const data: AwsTagMonthlyCostResponse = await res.json();
    return { data: data.data };
  }

  async getBudgets(params: AwsBudgetRequestParams): Promise<{ data?: AwsBudgetResponse; error?: string }> {
    try {
      const res = await fetch(`${this.API_BASE}/get-budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
  
      if (!res.ok) {
        const err = await res.json();
        return { error: err.error || 'Failed to fetch budgets' };
      }
  
      const data: AwsBudgetResponse = await res.json();
      return { data };
    } catch (error) {
      return { error: 'Something went wrong while fetching budgets' };
    }
  }  
  
}

export const authClient = new AuthClient();