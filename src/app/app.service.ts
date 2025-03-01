import { computed, Injectable, Signal, signal } from '@angular/core';

export enum BUDGET_TYPE {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export interface Budget {
  id: number;
  name: string;
  type: BUDGET_TYPE;
  amount: { [month: string]: number };
  children?: Budget[];
}

export interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
  row: Budget | null;
  month: string;
  isNameCell: boolean;
}

@Injectable()
export class AppService {
  startPeriod: Signal<string> = signal('2024-01');
  endPeriod: Signal<string> = signal('2024-12');

  budgets = signal<Budget[]>([
    {
      id: Math.random(),
      name: '',
      type: BUDGET_TYPE.INCOME,
      amount: {},
      children: [],
    },
    {
      id: Math.random(),
      name: '',
      type: BUDGET_TYPE.EXPENSE,
      amount: {},
      children: [],
    },
  ]);

  incomeBudgets = computed(() => {
    return this.budgets().filter((b) => b.type === BUDGET_TYPE.INCOME);
  });

  expenseBudgets = computed(() =>
    this.budgets().filter((b) => b.type === BUDGET_TYPE.EXPENSE)
  );
}
