import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ILanguage } from '@www/core/language.model';
import { LanguageService } from '@www/core/language.service';

/**
 * Select language component.
 */
@Component({
  selector: 'app-select-language, [app-select-language]',
  templateUrl: './select-language.component.html',
  styleUrls: ['./select-language.component.scss']
})
export class SelectLanguageComponent implements OnInit {
  @Input() popularLanguages: ILanguage[];
  @Input() filteredLanguages: ILanguage[];
  @Input() locale: string;
  @Output() languageChange = new EventEmitter<void>();

  public selectedLocale: string;

  constructor(private languageService: LanguageService) {}

  /**
   * Displays the selected language.
   */
  ngOnInit(): void {
    this.selectedLocale = this.locale;
  }

  /**
   * Selects site language.
   */
  public selectLanguage(item: ILanguage): void {
    if (this.locale !== item.id) {
      this.popularLanguages.map(l => {
        if (l.isSelected) {
          l.isSelected = false;
        }
      });

      this.filteredLanguages.map(l => {
        if (l.isSelected) {
          l.isSelected = false;
        }
      });

      item.isSelected = true;
      this.selectedLocale = item.id;

      this.locale = this.selectedLocale;

      this.languageService.setLanguage(this.selectedLocale);

      this.languageChange.emit();
    }
  }
}
