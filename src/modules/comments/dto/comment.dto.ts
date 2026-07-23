export interface CommentDTO {
  readonly id:          string;
  readonly content:     string;
  readonly date:        Date;
  readonly ownerkey:    string | null;
  readonly projectkey:  string;
}
