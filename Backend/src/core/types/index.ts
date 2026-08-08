import { Request } from "express";

export interface JwtPayload {
  sub: string; // userId
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}
