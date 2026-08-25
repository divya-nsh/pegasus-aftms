export interface SessionData {
  user?: {
    id: number;
    username: string;
  };
}

declare module "express-session" {
  interface SessionData {
    user?: {
      id: number;
      username: string;
    };
  }
}
