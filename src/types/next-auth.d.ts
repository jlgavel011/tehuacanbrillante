import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's id */
      id?: string;
      /** The user's role */
      role?: string;
      /** Whether the user is a master user */
      isMaster?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    isMaster?: boolean;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** The user's id */
    id?: string;
    /** The user's role */
    role?: string;
    /** Whether the user is a master user */
    isMaster?: boolean;
  }
} 