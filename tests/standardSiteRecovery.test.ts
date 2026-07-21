import {
  chmod,
  mkdtempDisposable,
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  clearStandardSiteCreate,
  createStandardSiteRkey,
  readStandardSiteRecoveryJournal,
  reserveStandardSiteCreate,
} from "../src/lib/standardSiteRecovery";

const entry = {
  sourcePath: "src/content/posts/example.md",
  canonicalUrl: "https://schalkneethling.com/posts/example/",
  collection: "site.standard.document" as const,
};

describe("Standard.site create recovery", () => {
  it("allocates valid, increasing TID record keys", () => {
    const first = createStandardSiteRkey();
    const second = createStandardSiteRkey();

    expect(first).toMatch(
      /^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$/u,
    );
    expect(second > first).toBe(true);
  });

  it("durably reuses a pending create reservation", async () => {
    await using temporaryDirectory = await mkdtempDisposable(
      join(tmpdir(), "standard-site-recovery-"),
    );
    const journalPath = join(temporaryDirectory.path, "recovery.json");

    const reservation = await reserveStandardSiteCreate(entry, journalPath);
    const repeatedReservation = await reserveStandardSiteCreate(
      entry,
      journalPath,
    );

    expect(repeatedReservation).toEqual(reservation);
    expect(await readStandardSiteRecoveryJournal(journalPath)).toMatchObject({
      pendingCreates: [reservation],
    });
    expect(JSON.parse(await readFile(journalPath, "utf8"))).toMatchObject({
      version: 1,
      pendingCreates: [reservation],
    });
  });

  it("serializes concurrent journal mutations", async () => {
    await using temporaryDirectory = await mkdtempDisposable(
      join(tmpdir(), "standard-site-recovery-"),
    );
    const journalPath = join(temporaryDirectory.path, "recovery.json");
    const entries = [
      entry,
      { ...entry, sourcePath: "src/content/posts/another.md" },
    ];

    const reservations = await Promise.all(
      entries.map((pendingEntry) =>
        reserveStandardSiteCreate(pendingEntry, journalPath),
      ),
    );

    expect(
      (await readStandardSiteRecoveryJournal(journalPath)).pendingCreates,
    ).toEqual(reservations);

    await Promise.all(
      reservations.map((reservation) =>
        clearStandardSiteCreate(reservation, journalPath),
      ),
    );
    await expect(stat(journalPath)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("fails closed on conflicting state and clears completed reservations", async () => {
    await using temporaryDirectory = await mkdtempDisposable(
      join(tmpdir(), "standard-site-recovery-"),
    );
    const journalPath = join(temporaryDirectory.path, "recovery.json");
    const reservation = await reserveStandardSiteCreate(entry, journalPath);

    await expect(
      reserveStandardSiteCreate(
        { ...entry, canonicalUrl: "https://schalkneethling.com/posts/other/" },
        journalPath,
      ),
    ).rejects.toThrow("has a different canonical URL");

    await clearStandardSiteCreate(reservation, journalPath);
    await expect(stat(journalPath)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(
      clearStandardSiteCreate(reservation, journalPath),
    ).rejects.toThrow("recovery reservation not found");
  });

  it("rejects a malformed recovery journal", async () => {
    await using temporaryDirectory = await mkdtempDisposable(
      join(tmpdir(), "standard-site-recovery-"),
    );
    const journalPath = join(temporaryDirectory.path, "recovery.json");
    await writeFile(
      journalPath,
      JSON.stringify({
        version: 1,
        pendingCreates: [{ ...entry, rkey: "not-a-tid" }],
      }),
    );

    await expect(readStandardSiteRecoveryJournal(journalPath)).rejects.toThrow(
      "Invalid Standard.site recovery journal",
    );
  });

  it("reports journal persistence failures with context", async () => {
    await using temporaryDirectory = await mkdtempDisposable(
      join(tmpdir(), "standard-site-recovery-"),
    );

    const journalPath = join(temporaryDirectory.path, "recovery.json");
    await reserveStandardSiteCreate(entry, journalPath);
    await chmod(temporaryDirectory.path, 0o500);

    try {
      await expect(
        reserveStandardSiteCreate(
          { ...entry, sourcePath: "src/content/posts/another.md" },
          journalPath,
        ),
      ).rejects.toThrow(
        `Failed to persist Standard.site recovery journal at ${journalPath}`,
      );
    } finally {
      await chmod(temporaryDirectory.path, 0o700);
    }
  });
});
