export interface AccountIdentityDTO {
  readonly account: {
    readonly id: string;
    readonly email: string;
    readonly created_at: Date;
    readonly updated_at: Date;
  };
  readonly user: {
    readonly id: string;
    readonly name: string;
    readonly username: string;
    readonly accountkey: string;
    readonly created_at: Date;
    readonly updated_at: Date;
  };
}
