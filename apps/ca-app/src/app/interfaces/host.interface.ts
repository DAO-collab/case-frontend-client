export interface Host {
  default_schemas: {
    cases: Schema[];
    events: Schema[];
    notes: Schema[];
    tasks: Schema[];
  };
  modules: string[];
  name: string;
  require_userfields: string[];
  roles_ct: number;
  stripe_connect_active: boolean;
  website: string;
};

interface Schema {
  schema: string;
  ui_schema: string;
};