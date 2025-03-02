import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

// Define extended Session and JWT types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "MASTER_ADMIN" | "MANAGER" | "PRODUCTION_CHIEF";
    };
  }

  interface User {
    id: string;
    role: "MASTER_ADMIN" | "MANAGER" | "PRODUCTION_CHIEF";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "MASTER_ADMIN" | "MANAGER" | "PRODUCTION_CHIEF";
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_SECRET || "",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "PRODUCTION_CHIEF", // Default role for Google sign-in
        };
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user?.password) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For Google authentication, create or update the user
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: {
            email: user.email as string,
          },
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email as string,
              name: user.name as string,
              image: user.image as string,
              role: "PRODUCTION_CHIEF",
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }

      // If it's a first time sign in with Google
      if (account?.provider === "google") {
        const dbUser = await prisma.user.findUnique({
          where: {
            email: token.email as string,
          },
        });
        
        if (dbUser) {
          token.role = dbUser.role;
          token.id = dbUser.id;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/login",
  },
}; 