export interface AuthStatus {
  data: {
    company_system: {
      design: {
        available_colors: { favicon: Array<string>; logo: Array<string> };
        colors: { background: string; text: string };
      };
    };
    family_name: string;
    given_name: string;
    locale: string;
    selfLink: string;
    user_id: string;
    zoneinfo: string;
  };
}
