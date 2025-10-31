export interface CreateCommentDTO {
  readonly content:     string;
  readonly date:        Date;
  readonly ownerkey:    string;
  readonly projectkey:  string;
}