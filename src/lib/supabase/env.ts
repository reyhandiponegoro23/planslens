// Supabase's "Connect" panel names the public key either ANON_KEY (legacy) or PUBLISHABLE_KEY;
// accept both. Each name is written out literally so Next.js can inline it in the browser bundle.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
