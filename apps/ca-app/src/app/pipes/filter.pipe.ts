import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'FilterPipe'
})
export class FilterPipe implements PipeTransform {
  transform(lookIn: any, args?: any, property?: any): any {
    return lookIn.filter((val: any) => {
      const valToCheck = property ? val[property] : val;

      return valToCheck !== undefined ? valToCheck.toLowerCase().indexOf(args.toLowerCase()) > -1 : true;
    });
  }
}
