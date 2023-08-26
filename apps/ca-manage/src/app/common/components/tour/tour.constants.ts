export const TOUR_PAGES = {
  beatify_app: 'beatify_app@settings',
  case_types: 'case_types@settings/caseform',
  assign_cases: 'assign_cases@settings/after-actions-users',
  profile_info: 'profile_info@settings/profile-info',
  intake_forms: 'intake_forms@settings/intake-forms',
  bootstrap_cases: 'intake_forms@settings/after-actions-templates'
};

export enum TourPopupState {
  Initial,
  Going,
  Minimized,
  Completed
}

export type TourItem = [string, { title: string; explanation: string }];

export const TOUR_POPUP_STATE_KEY: string = 'tour_popup_state';
