import {ErrorHandler, Injectable, Self} from "@angular/core";

@Injectable({providedIn: 'root'})
export class GlobalErrorHandler implements ErrorHandler {
  constructor(@Self() private globalModal: GlobalModalService) {
  }

  handleError(error: any): void {
    const words: string[] = ['Loading chunk', 'failed'];

    if (words.every(item => error?.message?.includes(item))) {
      this.globalModal.isChunkErrorModalShowed = true;
    }

    console.error(error)
  }
}

@Injectable({providedIn: 'root'})
export class GlobalModalService {
  isChunkErrorModalShowed: boolean = false;
}