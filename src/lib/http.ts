import { NextResponse } from "next/server";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const unauthorized = () => json({ error: "unauthorized" }, 401);
export const notFound = () => json({ error: "not_found" }, 404);
export const badRequest = (message: string) => json({ error: message }, 400);
