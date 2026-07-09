import "server-only";

import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId, readToken } from "../env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // Set to false if statically generating pages, using ISR or tag-based revalidation
  token: readToken, // required once the dataset is private
});
