export interface ApiToken {
  id: string;
  name: string;
  createdAt: string;
  /** Null for tokens that never expire. */
  expiresAt: string | null;
}

export interface CreateApiTokenRequest {
  name: string;
  expiresAt: string | null;
}

/** Only the name of an existing token can change; expiry is fixed when it is generated. */
export interface UpdateApiTokenRequest {
  name: string;
}

/** The secret is returned once, on creation, and is never retrievable again. */
export interface CreatedApiToken {
  token: ApiToken;
  secret: string;
}
