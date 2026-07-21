import {
  mkdir,
  mkdtempDisposable,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";

import { TID } from "@atproto/common-web";
import { isValidTid } from "@atproto/syntax";

export const standardSiteRecoveryJournalPath = ".standard-site/recovery.json";

export type StandardSiteCollection =
  | "site.standard.publication"
  | "site.standard.document";

export interface PendingStandardSiteCreate {
  readonly sourcePath: string;
  readonly canonicalUrl: string;
  readonly collection: StandardSiteCollection;
  readonly rkey: string;
}

interface StandardSiteRecoveryJournal {
  readonly version: 1;
  readonly pendingCreates: readonly PendingStandardSiteCreate[];
}

const emptyJournal = (): StandardSiteRecoveryJournal => ({
  version: 1,
  pendingCreates: [],
});

const journalLocks = new Map<string, Promise<void>>();

export const createStandardSiteRkey = () => TID.nextStr();

async function withJournalLock<T>(
  journalPath: string,
  operation: () => Promise<T>,
): Promise<T> {
  const previousOperation = journalLocks.get(journalPath) ?? Promise.resolve();
  const currentOperation = previousOperation.catch(() => {}).then(operation);
  const lock = currentOperation.then(
    () => {},
    () => {},
  );

  journalLocks.set(journalPath, lock);

  try {
    return await currentOperation;
  } finally {
    if (journalLocks.get(journalPath) === lock) {
      journalLocks.delete(journalPath);
    }
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isStandardSiteCollection(
  value: unknown,
): value is StandardSiteCollection {
  return (
    value === "site.standard.publication" || value === "site.standard.document"
  );
}

function isPendingCreate(value: unknown): value is PendingStandardSiteCreate {
  if (!isObject(value)) {
    return false;
  }

  const hasValidSourcePath = isNonEmptyString(value.sourcePath);
  const hasValidCanonicalUrl =
    isNonEmptyString(value.canonicalUrl) && URL.canParse(value.canonicalUrl);
  const hasValidCollection = isStandardSiteCollection(value.collection);
  const hasValidRkey = typeof value.rkey === "string" && isValidTid(value.rkey);

  return (
    hasValidSourcePath &&
    hasValidCanonicalUrl &&
    hasValidCollection &&
    hasValidRkey
  );
}

function isRecoveryJournal(
  value: unknown,
): value is StandardSiteRecoveryJournal {
  if (!isObject(value)) {
    return false;
  }

  const hasSupportedVersion = value.version === 1;
  const hasValidPendingCreates =
    Array.isArray(value.pendingCreates) &&
    value.pendingCreates.every(isPendingCreate);

  return hasSupportedVersion && hasValidPendingCreates;
}

export async function readStandardSiteRecoveryJournal(
  journalPath = standardSiteRecoveryJournalPath,
): Promise<StandardSiteRecoveryJournal> {
  try {
    const journal = JSON.parse(await readFile(journalPath, "utf8")) as unknown;

    if (!isRecoveryJournal(journal)) {
      throw new Error("Invalid Standard.site recovery journal");
    }

    return journal;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return emptyJournal();
    }
    throw error;
  }
}

async function writeJournal(
  journalPath: string,
  journal: StandardSiteRecoveryJournal,
) {
  const journalDirectory = dirname(journalPath);

  try {
    await mkdir(journalDirectory, { recursive: true });
    await using temporaryDirectory = await mkdtempDisposable(
      join(journalDirectory, ".recovery-"),
    );
    const temporaryPath = join(temporaryDirectory.path, "recovery.json");

    await writeFile(temporaryPath, `${JSON.stringify(journal, null, 2)}\n`, {
      mode: 0o600,
    });
    await rename(temporaryPath, journalPath);
  } catch (cause) {
    throw new Error(
      `Failed to persist Standard.site recovery journal at ${journalPath}`,
      { cause },
    );
  }
}

export async function reserveStandardSiteCreate(
  entry: Omit<PendingStandardSiteCreate, "rkey">,
  journalPath = standardSiteRecoveryJournalPath,
) {
  return withJournalLock(journalPath, async () => {
    const journal = await readStandardSiteRecoveryJournal(journalPath);
    const existing = journal.pendingCreates.find(
      (pending) =>
        pending.sourcePath === entry.sourcePath &&
        pending.collection === entry.collection,
    );

    if (existing) {
      if (existing.canonicalUrl !== entry.canonicalUrl) {
        throw new Error(
          `Pending Standard.site create for ${entry.sourcePath} has a different canonical URL`,
        );
      }
      return existing;
    }

    const reservation = { ...entry, rkey: createStandardSiteRkey() };
    await writeJournal(journalPath, {
      version: 1,
      pendingCreates: [...journal.pendingCreates, reservation],
    });
    return reservation;
  });
}

export async function clearStandardSiteCreate(
  reservation: PendingStandardSiteCreate,
  journalPath = standardSiteRecoveryJournalPath,
) {
  return withJournalLock(journalPath, async () => {
    const journal = await readStandardSiteRecoveryJournal(journalPath);
    const hasReservation = journal.pendingCreates.some(
      (pending) =>
        pending.collection === reservation.collection &&
        pending.rkey === reservation.rkey,
    );

    if (!hasReservation) {
      throw new Error(
        `Standard.site recovery reservation not found: ${reservation.collection}/${reservation.rkey}`,
      );
    }

    const pendingCreates = journal.pendingCreates.filter(
      (pending) =>
        pending.collection !== reservation.collection ||
        pending.rkey !== reservation.rkey,
    );

    if (pendingCreates.length > 0) {
      await writeJournal(journalPath, { version: 1, pendingCreates });
    } else {
      await rm(journalPath, { force: true });
    }
  });
}
