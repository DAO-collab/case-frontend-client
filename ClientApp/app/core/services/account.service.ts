import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';

import { UtilityService } from '../../core/services/utility.service';
import { JwtHelper } from 'angular2-jwt';
import { ProfileModel } from '../models/profile-model';

@Injectable()
export class AccountService {
    public jwtHelper: JwtHelper = new JwtHelper();

    constructor(private utilityService: UtilityService, private oAuthService: OAuthService) { }

    public get isLoggedIn(): boolean {
        return this.oAuthService.hasValidAccessToken();
    }
    public get user(): ProfileModel | undefined {
        if (this.idToken) {
            return this.jwtHelper.decodeToken(this.idToken);
        }
        return undefined;
    }
    public logout() {
        this.oAuthService.logOut();
        this.utilityService.navigateToSignIn();
    }

    public get accessToken(): string {
        return this.oAuthService.getAccessToken();
    }
    // Used to access user information
    public get idToken(): string {
        return this.oAuthService.getIdToken();
    }
}
