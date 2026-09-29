export interface SessionData {
  user?: {
    id: number;
    username: string;
    name: string;
    personnelId: number | null;
    role: {
      id: number;
      name: string;
      permissions: string[];
    } | null;
  };
}

declare module "express-session" {
  interface SessionData {
    user?: {
      id: number;
      username: string;
      name: string;
      personnelId: number | null;
      role: {
        id: number;
        name: string;
        permissions: string[];
      } | null;
    };
  }
}
