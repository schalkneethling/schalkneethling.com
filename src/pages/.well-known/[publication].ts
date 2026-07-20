import type { APIRoute } from "astro";

import { standardSite } from "../../lib/standardSite";
import {
  createPublicationVerificationResponse,
  getPublicationVerificationPaths,
} from "../../lib/standardSiteVerification";

export const getStaticPaths = () =>
  getPublicationVerificationPaths(standardSite.identity.publicationAtUri);

export const GET: APIRoute = ({ props }) =>
  createPublicationVerificationResponse(props.publicationAtUri as string);
