export interface Manager {
  id: string;
  full_name: string;
  email?: string;
  created_at: string;
}

export interface Agent {
  id: string;
  full_name: string;
  manager_id: string;
  avatar_seed: string;
}

export type Category = 'active' | 'not_in' | 'sick' | 'holiday' | 'leaver';

export interface CategoryMeta {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const CATEGORIES: Record<Category, CategoryMeta> = {
  active: {
    label: 'Active',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
  },
  not_in: {
    label: 'Not In',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
  },
  sick: {
    label: 'Sick',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
  },
  holiday: {
    label: 'Holiday',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
  },
  leaver: {
    label: 'Leaver',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
  },
};
