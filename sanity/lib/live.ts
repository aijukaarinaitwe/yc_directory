import "server-only";

import { defineLive } from "next-sanity";
import { client } from "@/sanity/lib/client";
import { token } from "@/sanity/env";

// Only `serverToken` is set here: it stays server-side (this module is
// `server-only`). Never pass the write token as `browserToken` — that
// token has Editor (write) rights and browserToken is shipped to the
// client bundle, which would let anyone extract it and mutate content.
export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: token,
});
