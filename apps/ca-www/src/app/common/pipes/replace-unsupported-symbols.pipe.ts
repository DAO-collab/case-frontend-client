import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'replaceUnsupportedSymbols'
})
export class ReplaceUnsupportedSymbolsPipe implements PipeTransform {
  transform(value: string): string {
    return value.replace('&#38;', "'").replace('&#39;', "'");
  }
}
