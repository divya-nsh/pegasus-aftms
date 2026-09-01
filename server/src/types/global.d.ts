export interface SessionData {
  user?: {
    id: number;
    username: string;
    role: string | null;
    name: string;
    personnelId: number | null;
  };
}

declare module "express-session" {
  interface SessionData {
    user?: {
      id: number;
      username: string;
      role: string | null;
      name: string;
      personnelId: number | null;
    };
  }
}
