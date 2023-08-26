import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { CacheRequest } from './cache-request.class';
import { ICacheEntry } from './cache-entry.model';

/**
 * Cache service.
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService implements CacheRequest {
  private cache = new Map<string, ICacheEntry>();
  private maxAge = 60 * 1000;

  /**
   * Fetches cached response for a request url from cache Map.
   */
  public get(req: HttpRequest<any>): HttpResponse<any> | null {
    const url = req.urlWithParams;

    const cached = this.cache.get(url);

    if (!cached) {
      return null;
    }

    const isExpired = cached.lastRead < Date.now() - this.maxAge;

    return isExpired ? null : cached.response;
  }

  /**
   * Creates cache entry.
   *
   * Sets cache entry into the cache Map.
   *
   * Deletes expired cache entry.
   */
  public set(req: HttpRequest<any>, response: HttpResponse<any>): void {
    const url = req.urlWithParams;

    const cacheEntry: ICacheEntry = { url, response, lastRead: Date.now() };

    this.cache.set(url, cacheEntry);

    const expired = Date.now() - this.maxAge;

    this.cache.forEach(entry => {
      if (entry.lastRead < expired) {
        this.cache.delete(entry.url);
      }
    });
  }

  /**
   * Deletes cache entry.
   */
  public delete(url: string): void {
    this.cache.delete(url);
  }
}
