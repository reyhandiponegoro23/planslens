import type { Locale } from "@/i18n/config";
import type messages from "../messages/id.json";

// Lets TypeScript flag unknown translation keys at compile time.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
