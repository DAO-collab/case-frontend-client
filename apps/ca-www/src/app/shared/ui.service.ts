import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

/**
 * User Interface service.
 */
@Injectable({
  providedIn: 'root'
})
export class UiService {
  private modalSubject: Subject<boolean> = new Subject();
  public modalObservable: Observable<boolean> = this.modalSubject.asObservable();
  public showModal = false;

  /**
   * Redirects to another website.
   */
  public redirectTo(url = ''): void {
    window.location.href = url;
  }

  /**
   * Toggles sign up modal.
   */
  public managedSignUpPopUp(cancel?: boolean) {
    this.showModal = !this.showModal;
    if (!this.showModal && !cancel) {
      this.modalSubject.next(this.showModal);
    }
  }

  /**
   * Scrolls page to top.
   */
  public scrollPageToTop() {
    window.scrollTo(0, 0);
  }
}
