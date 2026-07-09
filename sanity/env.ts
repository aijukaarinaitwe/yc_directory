export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-10-14";

export const dataset = assertValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  "Missing environment variable: NEXT_PUBLIC_SANITY_DATASET",
);

export const projectId = assertValue(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  "Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID",
);

export const token = process.env.SANITY_WRITE_TOKEN;

// Least-privilege token for server-side reads now that the dataset is private.
// Falls back to the write token so the app still works before this is configured,
// but a dedicated Viewer-scoped token should be used in production.
export const readToken = process.env.SANITY_READ_TOKEN || token;

function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage);
  }

  return v;
}
