import { Injectable } from "@angular/core";

@Injectable({providedIn: 'root'})
export class UtilsLibsService {
  recreateLoadMoreObject(startObj: any, nextObj: any, skipKey: string, limit: number) {
    const nextObjCloned = JSON.parse(JSON.stringify(nextObj));

    Object.keys(startObj).forEach((item) =>
      item !== skipKey ?
        delete startObj[item] :
        startObj.items = [...nextObjCloned.items.splice(0, limit)]
    );

    for (const [key, value] of Object.entries(nextObjCloned)) {
      if (key !== skipKey) {
        startObj[key] = value;
      }
    }
  }
}