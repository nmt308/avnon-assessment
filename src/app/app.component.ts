import { Component, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputNavigateDirective } from './directives/input-navigate.directive';
import { OnlyNumberDirective } from './directives/only-number.directive';
import { AppService, Budget, BUDGET_TYPE, ContextMenu } from './app.service';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { CloseContextMenuDirective } from './directives/close-context-menu.directive';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    OnlyNumberDirective,
    InputNavigateDirective,
    CloseContextMenuDirective,
  ],
  providers: [AppService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  months$: Observable<string[]>;
  contextMenu$: BehaviorSubject<ContextMenu> = new BehaviorSubject<ContextMenu>(
    {
      visible: false,
      x: 0,
      y: 0,
      row: null,
      month: '',
      isNameCell: false
    }
  );

  startPeriod: Signal<string>;
  endPeriod: Signal<string>;
  budgets: Signal<Budget[]>;
  incomeBudgets: Signal<Budget[]>;
  expenseBudgets: Signal<Budget[]>;

  BUDGET_TYPE = BUDGET_TYPE;

  constructor(private appService: AppService) {
    this.startPeriod = appService.startPeriod;
    this.endPeriod = appService.endPeriod;
    this.budgets = appService.budgets;
    this.incomeBudgets = appService.incomeBudgets;
    this.expenseBudgets = appService.expenseBudgets;

    this.months$ = combineLatest([
      toObservable(this.startPeriod),
      toObservable(this.endPeriod),
    ]).pipe(
      map(([start, end]) => {
        const startDate = new Date(`${start}-01`);
        const endDate = new Date(`${end}-01`);
        const months: string[] = [];

        if (startDate > endDate) {
          return months;
        }

        while (startDate <= endDate) {
          months.push(
            startDate.toLocaleString('default', {
              month: 'short',
              year: 'numeric',
            })
          );
          startDate.setMonth(startDate.getMonth() + 1);
        }
        return months;
      })
    ) as Observable<string[]>;
  }

  addBudget(type: BUDGET_TYPE, parentCategoryId?: number) {
    const budgets = this.appService.budgets();
    const defaultBudget: Budget = {
      id: Math.random(),
      name: '',
      type,
      amount: {},
    };

    if (parentCategoryId) {
      const parent = budgets.find((b) => b.id === parentCategoryId);

      if (parent) {
        parent.children?.push(defaultBudget);
      }
    } else {
      budgets.push({ ...defaultBudget, children: [] });
    }

    this.appService.budgets.set([...budgets]);
  }

  deleteBudget(id: number) {
    const budgets = this.appService.budgets();
    
    const rootIndex = budgets.findIndex(b => b.id === id);

    if (rootIndex !== -1) {
      budgets.splice(rootIndex, 1);

      this.appService.budgets.set([...budgets]);
      this.contextMenu$.next({ ...this.contextMenu$.getValue(), visible: false });

      return;
    }
  
    for (const parent of budgets) {
      if (parent.children) {
        const childIndex = parent.children.findIndex(c => c.id === id);

        if (childIndex !== -1) {
          parent.children.splice(childIndex, 1);

          this.appService.budgets.set([...budgets]);
          this.contextMenu$.next({ ...this.contextMenu$.getValue(), visible: false });

          return;
        }
      }
    }
    
    this.contextMenu$.next({ ...this.contextMenu$.getValue(), visible: false });
  }

  subTotal(month: string, type: BUDGET_TYPE, id: number): number {
    const budgets = type === BUDGET_TYPE.INCOME
      ? this.appService.incomeBudgets()
      : this.appService.expenseBudgets();
  
    const budget = budgets.find(budget => budget.id === id);

    if (!budget) {
      return 0;
    }
  
    const childTotal = budget.children?.reduce((sum, child) => sum + (child.amount[month] || 0), 0) || 0;
    return (budget.amount[month] || 0) + childTotal;
  }

  total(month: string, type: BUDGET_TYPE): number {
    const budgets = type === BUDGET_TYPE.INCOME
      ? this.appService.incomeBudgets()
      : this.appService.expenseBudgets();
  
    return budgets.reduce((sum, budget) => sum + this.subTotal(month, type, budget.id), 0);
  }

  profitLoss(month: string): number {
    return (this.total(month, BUDGET_TYPE.INCOME) - this.total(month, BUDGET_TYPE.EXPENSE));
  }

  openingBalance(month: string, index: number): number {
    if (index === 0) {
      return 0;
    }

    const date = new Date(month);

    date.setMonth(date.getMonth() - 1);

    const newMonth = date.toLocaleString('default', {
      year: 'numeric',
      month: 'short',
    });

    return this.closingBalance(newMonth, index - 1);
  }

  closingBalance(month: string, index: number): number {
    return this.openingBalance(month, index) + this.profitLoss(month);
  }

  applyToAll() {
    const { row, month } = this.contextMenu$.getValue();

    if (!row || !month) {
      this.contextMenu$.next({ ...this.contextMenu$.getValue(), visible: false });
      return;
    }
  
    const budgetToApply = row.amount[month];
    this.budgets().forEach(category => {
      category.amount[month] = budgetToApply;
      category.children?.forEach(child => child.amount[month] = budgetToApply);
    });
  
    this.contextMenu$.next({ ...this.contextMenu$.getValue(), visible: false });
  }

  onRightClick(event: MouseEvent, row: Budget, month: string, isNameCell: boolean = false) {
    event.preventDefault();

    const activeElement = document.activeElement as HTMLElement;
    const rect = activeElement.getBoundingClientRect();

    this.contextMenu$.next({
      visible: true,
      x: rect.left,
      y:rect.bottom + 15,
      row,
      month,
      isNameCell
    });
  }

  closeContextMenu() {
    this.contextMenu$.next({ ...this.contextMenu$.value, visible: false });
  }
}
