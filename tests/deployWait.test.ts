import { describe, expect, it } from "vitest";

import {
  describeDeployTimeout,
  readDeployMarker,
  waitForDeploy,
  type DeployMarker,
} from "../src/lib/deployWait";

const expectedSha = "f746d427c9940309cc5e24f1ffa05da6099e5c7d";
const previousSha = "e4865b5e7a1e4b1f0c3e3b2c9a0f1d2e3c4b5a69";
const laterSha = "0123456789abcdef0123456789abcdef01234567";

function marker(body: string, status = 200): DeployMarker {
  return { status, body };
}

const unreachable: DeployMarker = {
  status: undefined,
  body: undefined,
  error: "getaddrinfo ENOTFOUND schalkneethling.com",
};

/** Only laterSha descends from expectedSha in these tests. */
function isAncestor(ancestor: string, descendant: string) {
  return ancestor === expectedSha && descendant === laterSha;
}

describe("readDeployMarker", () => {
  it("is deployed when production serves the expected commit", () => {
    expect(
      readDeployMarker(marker(`${expectedSha}\n`), expectedSha, isAncestor),
    ).toEqual({ state: "deployed", servedSha: expectedSha });
  });

  it("is deployed when production serves a later commit that contains it", () => {
    expect(readDeployMarker(marker(laterSha), expectedSha, isAncestor)).toEqual(
      { state: "deployed", servedSha: laterSha },
    );
  });

  it("is waiting while production serves an earlier commit", () => {
    expect(
      readDeployMarker(marker(previousSha), expectedSha, isAncestor),
    ).toEqual({ state: "previous", servedSha: previousSha });
  });

  it("is waiting while production has no version marker", () => {
    expect(
      readDeployMarker(marker("Not found", 404), expectedSha, isAncestor),
    ).toEqual({ state: "missing", status: 404 });
  });

  it("treats a marker that is not a commit SHA as missing", () => {
    expect(
      readDeployMarker(marker("unknown"), expectedSha, isAncestor),
    ).toEqual({ state: "missing", status: 200 });
  });

  it("is waiting while production cannot be reached", () => {
    expect(readDeployMarker(unreachable, expectedSha, isAncestor)).toEqual({
      state: "unreachable",
      error: "getaddrinfo ENOTFOUND schalkneethling.com",
    });
  });
});

function fakeClock() {
  let currentMs = 0;

  return {
    now: () => currentMs,
    sleep: async (ms: number) => {
      currentMs += ms;
    },
  };
}

describe("waitForDeploy", () => {
  it("polls until production serves the expected commit", async () => {
    const responses = [
      marker(previousSha),
      marker(previousSha),
      marker(expectedSha),
    ];
    const clock = fakeClock();
    let requests = 0;

    const result = await waitForDeploy({
      expectedSha,
      fetchMarker: async () => responses[requests++],
      isAncestor,
      ...clock,
      timeoutMs: 60_000,
      intervalMs: 10_000,
    });

    expect(result).toEqual({
      outcome: "deployed",
      servedSha: expectedSha,
      elapsedMs: 20_000,
    });
    expect(requests).toBe(3);
  });

  it("times out with the last thing production served", async () => {
    const clock = fakeClock();
    let requests = 0;

    const result = await waitForDeploy({
      expectedSha,
      fetchMarker: async () => {
        requests++;
        return marker(previousSha);
      },
      isAncestor,
      ...clock,
      timeoutMs: 30_000,
      intervalMs: 10_000,
    });

    expect(result).toEqual({
      outcome: "timeout",
      lastReading: { state: "previous", servedSha: previousSha },
      elapsedMs: 30_000,
    });
    expect(requests).toBe(4);
  });
});

describe("describeDeployTimeout", () => {
  it("explains a deploy that never replaced the previous commit", () => {
    expect(
      describeDeployTimeout({
        expectedSha,
        timeoutMs: 900_000,
        lastReading: { state: "previous", servedSha: previousSha },
      }),
    ).toEqual({
      what: `Production still serves ${previousSha.slice(0, 7)} after 15 minutes, not ${expectedSha.slice(0, 7)}.`,
      reason:
        "The Netlify deploy failed, or it is queued or stuck. When the CI Production build job also failed for this commit, the change breaks the build.",
      nextStep:
        "Check the CI Production build job for this commit, then open https://app.netlify.com/projects/schalkneethling-com/deploys and read the deploy log.",
    });
  });

  it("explains a production site without a version marker", () => {
    expect(
      describeDeployTimeout({
        expectedSha,
        timeoutMs: 900_000,
        lastReading: { state: "missing", status: 404 },
      }),
    ).toEqual({
      what: "Production did not serve a commit SHA at /version.txt within 15 minutes (it returned 404).",
      reason:
        "The deployed build predates /version.txt, or the deploy that adds it has not finished.",
      nextStep:
        "Check https://app.netlify.com/projects/schalkneethling-com/deploys for the latest production deploy and its log.",
    });
  });

  it("states a timeout shorter than a minute in seconds", () => {
    expect(
      describeDeployTimeout({
        expectedSha,
        timeoutMs: 30_000,
        lastReading: { state: "previous", servedSha: previousSha },
      }).what,
    ).toBe(
      `Production still serves ${previousSha.slice(0, 7)} after 30 seconds, not ${expectedSha.slice(0, 7)}.`,
    );
  });

  it("explains a production site that could not be reached", () => {
    expect(
      describeDeployTimeout({
        expectedSha,
        timeoutMs: 60_000,
        lastReading: {
          state: "unreachable",
          error: "getaddrinfo ENOTFOUND schalkneethling.com",
        },
      }),
    ).toEqual({
      what: "/version.txt could not be fetched for 1 minute: getaddrinfo ENOTFOUND schalkneethling.com.",
      reason:
        "The site is unreachable from this machine, or the network blocks it.",
      nextStep:
        "Confirm the site loads in a browser and that this environment may reach schalkneethling.com, then run the checks again.",
    });
  });
});
