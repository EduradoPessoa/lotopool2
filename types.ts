
export type LotteryType = 'MEGA_SENA' | 'LOTOFACIL' | 'QUINA' | 'MAIS_MILIONARIA';

export type NotificationType = 'RESULT' | 'DEADLINE' | 'FINANCIAL' | 'INFO';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export type UserRole = 'SAAS_ADMIN' | 'POOL_ADMIN' | 'POOL_MEMBER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  whatsapp?: string;
  cpf?: string;
  pixKey?: string;
}

export interface Participant {
  id: string;
  name: string;
  phone: string;
  email: string;
  cpf: string;
  pixKey: string;
  luckyNumber?: number;
  profileId?: string;
}

export interface PoolGroup {
  id: string;
  name: string;
  balance: number;
  pixKey?: string; 
  notifActive?: boolean;
  participants: {
    participantId: string;
    luckyNumber?: number;
  }[];
  ownerId?: string;
}

export interface Ticket {
  id: string;
  numbers: number[];
  extraNumbers?: number[];
  cost: number;
  status: 'PENDING' | 'REGISTERED' | 'CHECKED';
  receiptUrl?: string; 
}

export interface Pool {
  id: string;
  groupId: string;
  name: string;
  type: LotteryType;
  drawNumber: string;
  drawDate: string;
  paymentDeadline?: string;
  participants: {
    participantId: string;
    shares: number;
    paid: boolean;
    paymentDate?: string;
  }[];
  tickets: Ticket[];
  totalPrize: number;
  status: 'OPEN' | 'CLOSED' | 'FINISHED';
  budgetUsed: number;
}

export interface LotteryConfig {
  name: string;
  minNumbers: number;
  maxNumbers: number;
  range: number;
  extraRange?: number;
  priceBase: number;
  color: string;
  gridCols: number;
  prices: Record<number, number>;
}

export const LOTTERY_CONFIGS: Record<LotteryType, LotteryConfig> = {
  MEGA_SENA: {
    name: 'Mega-Sena',
    minNumbers: 6,
    maxNumbers: 20,
    range: 60,
    priceBase: 5.00,
    color: 'bg-emerald-600',
    gridCols: 10,
    prices: { 6: 5, 7: 35, 8: 140, 9: 420, 10: 1050, 15: 25025, 20: 193800 }
  },
  LOTOFACIL: {
    name: 'Lotofácil',
    minNumbers: 15,
    maxNumbers: 20,
    range: 25,
    priceBase: 3.00,
    color: 'bg-purple-600',
    gridCols: 5,
    prices: { 15: 3, 16: 48, 17: 408, 18: 2448, 19: 11628, 20: 46512 }
  },
  QUINA: {
    name: 'Quina',
    minNumbers: 5,
    maxNumbers: 15,
    range: 80,
    priceBase: 2.50,
    color: 'bg-blue-600',
    gridCols: 10,
    prices: { 5: 2.5, 6: 15, 7: 52.5, 10: 630, 15: 7507.5 }
  },
  MAIS_MILIONARIA: {
    name: '+Milionária',
    minNumbers: 6,
    maxNumbers: 12,
    range: 50,
    extraRange: 6,
    priceBase: 6.00,
    color: 'bg-orange-500',
    gridCols: 10,
    prices: { 6: 6, 7: 42, 8: 168, 12: 5544 }
  }
};
