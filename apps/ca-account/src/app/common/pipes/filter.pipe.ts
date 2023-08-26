import { Pipe, PipeTransform } from '@angular/core';

/**
 * Filter pipe.
 */
@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
  transform(lookIn: string[], args?: string, property?: string): any {
    return (lookIn || []).filter((val: any) => {
      const valToCheck = property ? val[property] : val;

      return valToCheck !== undefined
        ? typeof valToCheck === 'string' && args
          ? valToCheck.toLowerCase().indexOf(args.toLowerCase()) > -1
          : valToCheck || false
        : true;
    });
  }
}
