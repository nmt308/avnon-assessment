import { Directive, ElementRef, HostListener, AfterViewInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, first } from 'rxjs/operators';

@Directive({
  selector: '[inputNavigate]'
})
export class InputNavigateDirective implements AfterViewInit, OnDestroy {
  private tableRowsChange$ = new Subject<void>();
  private mutationObserver: MutationObserver | null = null;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    const tableBody = this.getTableBody();

    this.mutationObserver = new MutationObserver((mutations) => {
      const hasRowMutation = mutations.some(mutation =>
        Array.from(mutation.addedNodes).some(node => node.nodeName === 'TR')
      );

      if (hasRowMutation) {
        this.tableRowsChange$.next();
      }
    });

    this.mutationObserver.observe(tableBody, { childList: true });
  }

  ngOnDestroy() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    this.tableRowsChange$.complete();
  }

  @HostListener('keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const { tableBody, currentRow, allRows, cellsInCurrentRow, currentRowIndex, currentCellIndex } = this.extractTableInfo();

    switch (event.key) {
      case 'Enter':
        event.preventDefault();

        this.tableRowsChange$.pipe(first()).subscribe(() => {
          const updatedRows = Array.from(tableBody.querySelectorAll('tr')) as HTMLTableRowElement[];
          const currentRowIndexAfterMutation = updatedRows.indexOf(currentRow);

          this.navigateVertical(updatedRows, currentRowIndexAfterMutation + 1, currentCellIndex);
        });
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.navigateVertical(allRows, currentRowIndex + 1, currentCellIndex);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.navigateVertical(allRows, currentRowIndex - 1, currentCellIndex);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.navigateHorizontal(cellsInCurrentRow, currentCellIndex - 1);
        break;
      case 'ArrowRight':
      case 'Tab':
        event.preventDefault();
        if (currentCellIndex + 1 >= cellsInCurrentRow.length) {
          this.navigateVertical(allRows, currentRowIndex + 1, 0);
        } else {
          this.navigateHorizontal(cellsInCurrentRow, currentCellIndex + 1);
        }
        break;
    }
  }

  private navigateVertical(allRows: HTMLTableRowElement[], targetRowIndex: number, cellIndex: number) {
    if (targetRowIndex >= 0 && targetRowIndex < allRows.length) {
      const targetRow = allRows[targetRowIndex];
      const targetCells = Array.from(targetRow.querySelectorAll('td')) as HTMLTableCellElement[];
      const targetCell = targetCells[cellIndex];
      const input = targetCell?.querySelector('input') as HTMLInputElement | null;

      input?.focus();
    }
  }

  private navigateHorizontal(cells: HTMLTableCellElement[], targetCellIndex: number) {
    if (targetCellIndex >= 0 && targetCellIndex < cells.length) {
      const targetCell = cells[targetCellIndex];
      const input = targetCell.querySelector('input') as HTMLInputElement | null;

      input?.focus();
    }
  }

  private getTableBody(): HTMLTableSectionElement {
    const currentInput = this.el.nativeElement as HTMLInputElement;
    const currentCell = currentInput.closest('td') as HTMLTableCellElement;
    const currentRow = currentCell.closest('tr') as HTMLTableRowElement;
    return currentRow.closest('tbody') as HTMLTableSectionElement;
  }

  private extractTableInfo() {
    const currentInput = this.el.nativeElement as HTMLInputElement;
    const currentCell = currentInput.closest('td') as HTMLTableCellElement;
    const currentRow = currentCell.closest('tr') as HTMLTableRowElement;
    const tableBody = currentRow.closest('tbody') as HTMLTableSectionElement;
    const allRows = Array.from(tableBody.querySelectorAll('tr')) as HTMLTableRowElement[];
    const currentRowIndex = allRows.indexOf(currentRow);
    const cellsInCurrentRow = Array.from(currentRow.querySelectorAll('td')) as HTMLTableCellElement[];
    const currentCellIndex = cellsInCurrentRow.indexOf(currentCell);

    return { tableBody, currentInput, currentCell, currentRow, allRows, cellsInCurrentRow, currentRowIndex, currentCellIndex };
  }
}
