function withoutTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function serverApiUrl(): string {
  const url = process.env.API_URL;
  if (!url) throw new Error("API_URL is not set. Copy apps/web/.env.example to apps/web/.env.local.");
  return withoutTrailingSlash(url);
}

export function browserApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not set. Copy apps/web/.env.example to apps/web/.env.local.");
  return withoutTrailingSlash(url);
}
