export function assertStandardSitePublisherDid(
  authenticatedDid: string,
  expectedDid: string | undefined,
) {
  if (!expectedDid) {
    throw new Error("Standard.site publisher DID is not configured");
  }

  if (authenticatedDid !== expectedDid) {
    throw new Error(
      `Authenticated publisher DID does not match the configured DID: ${authenticatedDid}`,
    );
  }
}
