import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  Renderer2,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { delay, takeUntil } from 'rxjs/operators';

import { TranslateService } from '@ngx-translate/core';
import { MarkdownComponent } from 'ngx-markdown';

import { DocumentationService } from '../services/documentation.service';
import { LanguageService } from '../../../core/language.service';

@Component({
  selector: 'app-docs-preview',
  templateUrl: './docs-preview.component.html',
  styleUrls: ['./docs-preview.component.css']
})
export class DocsPreviewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('rightSideMenu') rightSideMenu: ElementRef;
  @ViewChild('markdownComponent', { static: false }) set content(content: MarkdownComponent) {
    if (content) {
      this._markdownComponent = content.element;

      this.createSubcategoryList();
    }
  }

  get markdownComponent() {
    return this._markdownComponent;
  }

  currentFile;
  categoriesJSONData;
  docsJSONData;
  docHtmlText: string;
  searchValue: string;
  zoomedImageSrc: string;
  fileName: string;
  hideSubcategorySection = false;

  private unsubscribe: Subject<void> = new Subject<void>();
  private _markdownComponent: ElementRef;
  private isSubcategorySet = false;

  @HostListener('window:hashchange', ['$event'])
  hashChangeHandler(e) {
    this.scrollToAnchorLink(e.target.location.hash, 0);
  }

  constructor(
    private router: Router,
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private translate: TranslateService,
    private documentationService: DocumentationService,
    private languageService: LanguageService
  ) {
  }

  ngOnInit(): void {
    const filename = this.router.url.replace('/docs/', '');
    const endIndex = filename.indexOf('#');

    if (endIndex === -1) {
      this.fileName = filename;

      window.scrollTo(0, 0);
    } else {
      this.fileName = filename.slice(0, endIndex);
    }

    this.getDocHtml();

    this.documentationService.docsJSONFileData.asObservable()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(res => {
        this.docsJSONData = res;
        this.currentFile = res[this.fileName];

        if (this.currentFile) {
          this.documentationService.setMetaTagsToThePage(
            this.currentFile.title,
            this.currentFile.description,
            this.currentFile.tags
          );
        }
      });

    this.documentationService.categoriesJSONFileData.asObservable()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(res => this.categoriesJSONData = res);

    this.renderer.listen(this.elementRef.nativeElement, 'click', event => {
      event.target instanceof HTMLImageElement && !this.zoomedImageSrc
        ? this.zoomedImageSrc = event.target.src
        : this.zoomedImageSrc = null;
    });

    // change Markdown language on every language change
    this.languageService.systemLanguage
      .pipe(
        takeUntil(this.unsubscribe),
        delay(300)
      )
      .subscribe(() => {
        this.getDocHtml();
        this.isSubcategorySet = false;
        setTimeout(() => {
          this.createSubcategoryList();
        }, 100)
      });
  }

  ngAfterViewInit(): void {
    this.renderer.addClass(document.querySelector('#root'), 'background-none');
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.querySelector('#root'), 'background-none');
    this.documentationService.deleteTags();
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  isContainsSearchValue(key): boolean {
    const docsElement = this.docsJSONData[key];

    return !!docsElement && !!docsElement.tags?.filter(element => element.includes(this.searchValue.toLowerCase()))?.length;
  }

  getDocHtml(): void {
    const lang = this.translate.currentLang;
    this.documentationService.getDataFromHtml(this.fileName, lang)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.docHtmlText = res.replace(/\/images\//g, '/assets/markdowns/images/');
      });
  }

  findTitleByObjectKey(key): string {
    return this.docsJSONData[key]?.title ?? '';
  }

  private createSubcategoryList(): void {
    if (this.isSubcategorySet) {
      return;
    }
    this.isSubcategorySet = true;
    this.removeOldSubCategoryList();
    const subCategories: QueryList<ElementRef> = this.markdownComponent.nativeElement.querySelectorAll('h2');
    const subCategoriesArr: any[] = Array.from(subCategories);

    if (subCategoriesArr.length) {
      const parentDiv = this.renderer.createElement('div');

      for (let i = 0; i <= subCategoriesArr.length - 1; i++) {
        const element = this.renderer.createElement('a');
        const anchorLink = subCategoriesArr[i].innerText.toLowerCase().replace(/ /g, '-');
        element.innerHTML = subCategoriesArr[i].innerText;

        this.renderer.setProperty(element, 'href', `docs/${this.fileName}#${anchorLink}`);
        this.renderer.addClass(element, 'subcategory-title');
        this.renderer.addClass(parentDiv, 'subcategory-wrapper');
        this.renderer.appendChild(parentDiv, element);
      }

      this.renderer.appendChild(this.rightSideMenu.nativeElement.querySelector('.subcategory'), parentDiv);
    } else {
      setTimeout(() => {
        this.hideSubcategorySection = true;
      }, 0);
    }

    this.scrollToAnchorLinkOnPageLoad();
  }

  private removeOldSubCategoryList(): void {
    const subCategory = this.rightSideMenu.nativeElement.querySelector('.subcategory');
    const subCategoryWrappers = subCategory.getElementsByClassName('subcategory-wrapper');
    // tslint:disable-next-line:prefer-for-of
    for (let i=0; i < subCategoryWrappers.length; i++) {
      const subCategoryWrapper = subCategoryWrappers[i];
      this.renderer.removeChild(subCategory, subCategoryWrapper);
    }
  }

  private scrollToAnchorLink(element, ms): void {
    const el = document.querySelector(element);

    setTimeout(() => {
      el.scrollIntoView({ block: 'center' });
    }, ms);
  }

  private scrollToAnchorLinkOnPageLoad(): void {
    const filename = this.router.url.replace('/docs/', '');
    const endIndex = filename.indexOf('#');

    if (endIndex !== -1) {
      const element = filename.slice(endIndex);

      this.scrollToAnchorLink(element, 1000);
    }
  }
}
