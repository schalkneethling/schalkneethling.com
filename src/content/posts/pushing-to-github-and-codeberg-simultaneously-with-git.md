---
title: "Pushing to GitHub and Codeberg Simultaneously with Git"
pubDate: 2026-04-12
description: "Learn how to configure Git to push your code to both GitHub and Codeberg with a single command, including SSH key setup and a handy shell alias for branch-specific control."
author: "Schalk Neethling"
tags: ["git"]
---

## Why Codeberg?

If you have not come across [Codeberg](https://codeberg.org) before, it is a community-driven Git hosting platform run by a non-profit organisation based in Germany. It is built on [Forgejo](https://forgejo.org/) (a fork of Gitea) and offers a familiar experience if you are used to GitHub or GitLab. Think of it as a place to host your code that is not tied to a large corporation — a good option if you value independence and open-source governance.

Whether you want a backup mirror of your repositories or you are exploring alternatives to GitHub, pushing to both platforms simultaneously is surprisingly straightforward.

## Setting Up a Codeberg Account and Repository

First, head over to [codeberg.org](https://codeberg.org) and create an account. Once you are in, create a new repository that matches the one you want to mirror from GitHub. Keep it empty — do not initialise it with a README or licence file, as this will cause conflicts when you push for the first time.

## Configuring SSH Access for Codeberg

If you already use SSH with GitHub, you will want a dedicated key for Codeberg. Generate one with:

```bash
ssh-keygen -t ed25519 -C "your@email.com" -f ~/.ssh/id_ed25519_codeberg
```

Next, add the public key to Codeberg. Copy it to your clipboard:

```bash
pbcopy < ~/.ssh/id_ed25519_codeberg.pub
```

> **Note:** `pbcopy` is a macOS utility. On Linux with X11, use `xclip -selection clipboard < ~/.ssh/id_ed25519_codeberg.pub`. On Wayland, use `wl-copy < ~/.ssh/id_ed25519_codeberg.pub`.

Then head to Codeberg → Settings → SSH/GPG Keys and paste it in. Once added, you will see a "Verify" button next to your key. Click it and follow the instructions on the verification page to confirm ownership of the key.

### Updating Your SSH Config

Open (or create) `~/.ssh/config` and add a block for Codeberg. If you already have one for GitHub, place it alongside:

```plaintext
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_github
  IdentitiesOnly yes
  AddKeysToAgent yes
  UseKeychain yes

Host codeberg.org
  HostName codeberg.org
  User git
  IdentityFile ~/.ssh/id_ed25519_codeberg
  IdentitiesOnly yes
  AddKeysToAgent yes
  UseKeychain yes
```

A few things to note about this configuration:

- `IdentitiesOnly yes` ensures SSH only offers the specified key for that host, rather than cycling through all your keys. This avoids issues where a server rejects you after too many failed attempts.
- `AddKeysToAgent yes` automatically adds the key to your SSH agent the first time you use it in a session, so you are not prompted for your passphrase on every push.
- `UseKeychain yes` is macOS-specific and stores the passphrase in the Apple Keychain, persisting it across reboots. On Linux, you can remove this line and rely on your desktop environment keyring (GNOME Keyring, KDE Wallet, etc.) for a similar experience.

### Verifying the Connection

Test that everything is wired up correctly:

```bash
ssh -T git@codeberg.org
```

You should see a welcome message with your Codeberg username. If you get `Permission denied (publickey)`, run the verbose version to see which key is being offered:

```bash
ssh -vT git@codeberg.org
```

Look for `Offering public key:` in the output — it should point to your Codeberg key file.

## Configuring Git to Push to Both Remotes

You have two options here, depending on how much control you want.

### Option 1: Multiple Push URLs on a Single Remote

This is the simplest approach. You add both push URLs to your existing `origin` remote:

```bash
git remote set-url --add --push origin git@codeberg.org:YOUR_USERNAME/YOUR_REPO.git
git remote set-url --add --push origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
```

One thing to be aware of: when you use `--add --push` for the first time, it overrides the default push URL, so you need to add both URLs explicitly. After this, every `git push origin` pushes to both GitHub and Codeberg simultaneously.

### Option 2: Separate Remotes

If you prefer more control — for example, only pushing to Codeberg occasionally — add it as a separate remote:

```bash
git remote add codeberg git@codeberg.org:YOUR_USERNAME/YOUR_REPO.git
```

Then push to it explicitly when you want to:

```bash
git push codeberg main
```

### Verifying Your Setup

Run `git remote -v` to confirm your configuration. With Option 1, you should see both push URLs listed under `origin`.

## A Shell Alias for Branch-Specific Control

If you want to push to both platforms only when you are on `main`, but push to GitHub alone for feature branches, a small shell function does the trick. Add this to your `~/.zshrc` or `~/.bashrc`:

```bash
dual-push() {
  branch=$(git symbolic-ref --short HEAD)
  if [ "$branch" = "main" ]; then
    git push origin main && git push codeberg main
  else
    git push origin "$branch"
  fi
}
```

This assumes you are using Option 2 (separate remotes). Reload your shell config with `source ~/.zshrc`, and from then on you can use `dual-push` instead of `git push`.

## Wrapping Up

Once this is all in place, your workflow does not change much at all. You push as you always have, and your code lands on both platforms. It is a small investment of time for the peace of mind that your work is not tied to a single host — and if you ever want to move fully to Codeberg or share a project with someone who prefers it, you are already there.

## Further Reading

- [Codeberg Documentation](https://docs.codeberg.org/)
- [Forgejo — the platform Codeberg is built on](https://forgejo.org/)
- [Git documentation: git-remote](https://git-scm.com/docs/git-remote)
- [Git documentation: git-config](https://git-scm.com/docs/git-config)
