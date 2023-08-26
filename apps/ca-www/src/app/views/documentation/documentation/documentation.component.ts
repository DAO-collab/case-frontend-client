import { AfterViewInit, Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DocumentationService } from '../services/documentation.service';

@Component({
  selector: 'app-documentation',
  templateUrl: './documentation.component.html',
  styleUrls: ['./documentation.component.css']
})
export class DocumentationComponent implements OnInit, AfterViewInit, OnDestroy {
  categoriesJSONData;
  docsJSONData;
  searchValue: string;
  allCategories = 'All Categories';
  categoryDropdownValues: { value: string }[] = [];
  selectedSearchCategory = this.allCategories;

  private unsubscribe: Subject<void> = new Subject<void>();

  constructor(
    private renderer: Renderer2,
    private documentationService: DocumentationService
  ) {
  }

  ngOnInit(): void {
    this.documentationService.categoriesJSONFileData.asObservable()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(res => {
        this.categoriesJSONData = res;
        res.forEach(category => this.categoryDropdownValues.push({ value: category.name }));
      });

    this.documentationService.docsJSONFileData.asObservable()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(res => this.docsJSONData = res);

    this.documentationService.setMetaTagsToThePage(
      'Support Documentation',
      'Get started: processes, best practices, setup guides, and more!',
      ['support', 'documentation', 'guides', 'caseactive', 'find', 'search']
    );
  }

  ngAfterViewInit(): void {
    this.renderer.addClass(document.querySelector('#root'), 'gray-dots');
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.querySelector('#root'), 'gray-dots');
    this.documentationService.deleteTags();
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  isContainsSearchValue(key): boolean {
    const docsElement = this.docsJSONData[key];

    return !!docsElement && !!docsElement.tags?.filter(element => element.includes(this.searchValue.toLowerCase()))?.length;
  }
}
