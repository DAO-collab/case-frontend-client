export class ContactRequest {
  alias_type: string;
  username: any;
}

export class ContactUpdateRequest {
  alias_type: string;
  code: any;
}

export class ContactDeleteRequest {
  alias_type: string;
  type: string;
}
