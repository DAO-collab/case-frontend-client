import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'split' })
export class SplitPipe implements PipeTransform {
  transform(value: string, delimiter: string): string {
    if (!value) return '';
    const segments = value.split(delimiter);
    return segments.pop() || '';
  }
}
