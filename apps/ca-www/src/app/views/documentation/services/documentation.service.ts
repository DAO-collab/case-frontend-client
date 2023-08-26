import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Meta, Title } from '@angular/platform-browser';
import { Observable, ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DocumentationService {
  categoriesJSONFileData: ReplaySubject<any> = new ReplaySubject<any>(1);
  docsJSONFileData: ReplaySubject<any> = new ReplaySubject<any>(1);

  constructor(
    private http: HttpClient,
    private meta: Meta,
    private title: Title
  ) {
  }

  getDataFromHtml(fileName, lang = 'en'): Observable<string> {
    return this.http.get(`/opts/${lang}/docs/docs/${fileName}.html`, { responseType: 'text' });
  }

  getDataFromJSON(fileName): Observable<any> {
    return this.http.get(`/assets/markdowns/${fileName}.json`);
  }

  setMetaTagsToThePage(title, description, keywords): void {
    this.title.setTitle(`${title} | CaseActive`);

    if (this.meta.getTag('name="description"')) {
      this.meta.updateTag({ name: 'description', content: description });
    } else {
      this.meta.addTag({ name: 'description', content: description });
    }

    if (this.meta.getTag('name="keywords"')) {
      this.meta.updateTag({ name: 'keywords', content: keywords });
    } else {
      this.meta.addTag({ name: 'keywords', content: keywords });
    }

    if (this.meta.getTag('name="title"')) {
      this.meta.updateTag({ name: 'title', content: `${title} | CaseActive` });
    } else {
      this.meta.addTag({ name: 'title', content: `${title} | CaseActive` });
    }
  }

  deleteTags(): void {
    this.title.setTitle(`CaseActive`);
    this.meta.removeTag('name="description"');
    this.meta.removeTag('name="keywords"');
    this.meta.removeTag('name="title"');
  }
}
