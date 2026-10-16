import {
  UNREACHABLE_PROBLEM,
  type LivePostProblem,
} from "./livePostVerification.ts";

export const DEPLOY_MARKER_PATH = "/version.txt";
export const NETLIFY_DEPLOYS_URL =
  "https://app.netlify.com/projects/schalkneethling-com/deploys";

const COMMIT_SHA_PATTERN = /^[0-9a-f]{7,40}$/i;

/** The response to one request for the deploy marker. */
export type DeployMarker = {
  readonly status: number | undefined;
  readonly body: string | undefined;
  readonly error?: string;
};

/**
 * What one look at production told us. Only "deployed" ends the wait; the
 * other states are kept so a timeout can explain what production served last.
 */
export type DeployReading =
  | { readonly state: "deployed"; readonly servedSha: string }
  | { readonly state: "previous"; readonly servedSha: string }
  | { readonly state: "missing"; readonly status: number }
  | { readonly state: "unreachable"; readonly error: string };

/** Whether `ancestor` is part of the history of `descendant`. */
export type IsAncestor = (ancestor: string, descendant: string) => boolean;

export type DeployWaitResult =
  | {
      readonly outcome: "deployed";
      readonly servedSha: string;
      readonly elapsedMs: number;
    }
  | {
      readonly outcome: "timeout";
      readonly lastReading: Exclude<DeployReading, { state: "deployed" }>;
      readonly elapsedMs: number;
    };

export type DeployWaitOptions = {
  readonly expectedSha: string;
  readonly fetchMarker: () => Promise<DeployMarker>;
  readonly isAncestor: IsAncestor;
  readonly now: () => number;
  readonly sleep: (ms: number) => Promise<void>;
  readonly timeoutMs: number;
  readonly intervalMs: number;
};

function isSameCommit(servedSha: string, expectedSha: string) {
  const served = servedSha.toLowerCase();
  const expected = expectedSha.toLowerCase();

  return served.startsWith(expected) || expected.startsWith(served);
}

export function readDeployMarker(
  marker: DeployMarker,
  expectedSha: string,
  isAncestor: IsAncestor,
): DeployReading {
  if (marker.status === undefined) {
    return { state: "unreachable", error: marker.error ?? "no response" };
  }

  const servedSha = marker.body?.trim() ?? "";
  const isCommitSha =
    marker.status === 200 && COMMIT_SHA_PATTERN.test(servedSha);

  if (!isCommitSha) {
    return { state: "missing", status: marker.status };
  }

  // A later merge can deploy before this check starts. Its build still
  // contains the expected commit, so it counts as deployed.
  const containsExpectedCommit =
    isSameCommit(servedSha, expectedSha) || isAncestor(expectedSha, servedSha);

  return containsExpectedCommit
    ? { state: "deployed", servedSha }
    : { state: "previous", servedSha };
}

/**
 * Polls the production deploy marker until it names the expected commit, or
 * a commit that contains it, or until the timeout passes.
 */
export async function waitForDeploy({
  expectedSha,
  fetchMarker,
  isAncestor,
  now,
  sleep,
  timeoutMs,
  intervalMs,
}: DeployWaitOptions): Promise<DeployWaitResult> {
  const startMs = now();

  while (true) {
    const reading = readDeployMarker(
      await fetchMarker(),
      expectedSha,
      isAncestor,
    );
    const elapsedMs = now() - startMs;

    if (reading.state === "deployed") {
      return { outcome: "deployed", servedSha: reading.servedSha, elapsedMs };
    }

    if (elapsedMs >= timeoutMs) {
      return { outcome: "timeout", lastReading: reading, elapsedMs };
    }

    await sleep(Math.min(intervalMs, timeoutMs - elapsedMs));
  }
}

function shortSha(sha: string) {
  return sha.slice(0, 7);
}

function formatDuration(ms: number) {
  if (ms < 60_000) {
    const seconds = Math.round(ms / 1_000);

    return seconds === 1 ? "1 second" : `${seconds} seconds`;
  }

  const minutes = Math.round(ms / 60_000);

  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

export function describeDeployTimeout({
  expectedSha,
  timeoutMs,
  lastReading,
}: {
  readonly expectedSha: string;
  readonly timeoutMs: number;
  readonly lastReading: Extract<
    DeployWaitResult,
    { outcome: "timeout" }
  >["lastReading"];
}): LivePostProblem {
  const duration = formatDuration(timeoutMs);

  switch (lastReading.state) {
    case "previous":
      return {
        what: `Production still serves ${shortSha(lastReading.servedSha)} after ${duration}, not ${shortSha(expectedSha)}.`,
        reason:
          "The Netlify deploy failed, or it is queued or stuck. When the CI Production build job also failed for this commit, the change breaks the build.",
        nextStep: `Check the CI Production build job for this commit, then open ${NETLIFY_DEPLOYS_URL} and read the deploy log.`,
      };
    case "missing":
      return {
        what: `Production did not serve a commit SHA at ${DEPLOY_MARKER_PATH} within ${duration} (it returned ${lastReading.status}).`,
        reason: `The deployed build predates ${DEPLOY_MARKER_PATH}, or the deploy that adds it has not finished.`,
        nextStep: `Check ${NETLIFY_DEPLOYS_URL} for the latest production deploy and its log.`,
      };
    case "unreachable":
      return {
        what: `${DEPLOY_MARKER_PATH} could not be fetched for ${duration}: ${lastReading.error}.`,
        ...UNREACHABLE_PROBLEM,
      };
  }
}
