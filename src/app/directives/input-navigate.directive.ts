import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[inputNavigate]',
})
export class InputNavigateDirective {
  constructor(private el: ElementRef) {}

  @HostListener('keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const currentInput = this.el.nativeElement as HTMLInputElement;
    const currentCell = currentInput.closest('td') as HTMLTableCellElement;
    const currentRow = currentCell.closest('tr') as HTMLTableRowElement;
    const tableBody = currentRow.closest('tbody') as HTMLTableSectionElement;

    const allRows = Array.from(tableBody.querySelectorAll('tr')) as HTMLTableRowElement[];
    const currentRowIndex = allRows.indexOf(currentRow);
    const cellsInCurrentRow = Array.from(currentRow.querySelectorAll('td')) as HTMLTableCellElement[];
    const currentCellIndex = cellsInCurrentRow.indexOf(currentCell);

    switch (event.key) {
      case 'Enter':
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
        this.navigateHorizontal(cellsInCurrentRow, currentCellIndex + 1);
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
}
