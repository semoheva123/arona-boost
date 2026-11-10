import postgres from "npm:postgres@3.4.5";
import bcrypt from "npm:bcryptjs@2.4.3";
import QRCode from "npm:qrcode@1.5.4";
// @ts-ignore: JS module entry for Supabase CLI deploy
import { createEdgeHandler } from "./entry.js";

const handler = createEdgeHandler(
  { postgres, bcrypt, QRCode },
  (key: string) => Deno.env.get(key) || ""
);

Deno.serve((req: Request) => handler(req));
