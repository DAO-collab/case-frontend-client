export interface CompanySystem {
  design: {
    available_colors: {
      favicon: string[];
      logo: string[];
    };
    colors: {
      background: string;
      text: string;
    };
    uuid?: string;
  };
  logo?: {
    uuid?: string;
  };
  favicon?: {
    uuid?: string;
  };
};