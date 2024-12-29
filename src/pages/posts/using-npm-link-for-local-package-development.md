---
layout: ../../layouts/MarkdownPostLayout.astro
title: Using npm link for Local Package Development
pubDate: 2024-12-29
description: Learn how to use npm link to test your NPM packages locally before publishing to the registry. With some common troubleshooting tips and best practices.
author: "Schalk Neethling"
tags: ["nodejs"]
---

When developing NPM packages, it's a huge time saver to be able to test your code locally _before_ publishing to the registry. Essentially, you do not want to test in production. The [`npm link` command](https://docs.npmjs.com/cli/commands/npm-link) provides a convenient way to do this by creating symbolic links to your local package.

> Symbolic what now? A symbolic link is a reference to a file or directory that points to another location on your filesystem. If you want to know even more, there is a [page on Wikipedia with all of the details](https://en.wikipedia.org/wiki/Symbolic_link).

## Basic Usage

There are two ways to use `npm link`:

1. The traditional two-step approach:

   ```bash
   # In your package directory
   npm link

   # In your test project directory
   npm link package-name
   ```

2. The shortcut method (recommended for convenience):
   ```bash
   # In your test project directory
   npm link ../path-to-your-package
   ```

The shortcut method is more straightforward as it only requires one command, using the relative path to your package's root directory.

## How it Works

When you run `npm link`, NPM creates a symbolic link in your global `node_modules` directory. For example, if you're using NVM (Node Version Manager) (and you should - [learn more in my article on NVM](https://schalkneethling.com/posts/installing-node-and-managing-versions/)), you can find these symlinks in:

```bash
~/.nvm/versions/node/[node-version]/lib/node_modules
```

This symlink points to your local package source, meaning any changes you make to your package are immediately reflected in projects that link to it, so there is generally (more on the generally below) no need to re-run `npm link` after each change.

## Important Considerations

1. Linked dependencies are not saved to `package.json` by default. This prevents accidentally replacing version ranges (like `^3.0.1`) with file paths that wouldn't work for other developers.
2. When working with workspaces, `npm link` behavior can vary depending on dependency conflicts. You can use the `--workspace` flag for more precise control.

For detailed information about these, other advanced scenarios, and a boat load of configuration options refer to the [official npm link documentation](https://docs.npmjs.com/cli/commands/npm-link).

## A Real-World Example

I've been using this approach [while developing Project Calavera](https://github.com/schalkneethling/create-project-calavera), a CLI tool that works with `npm create`. By using `npm link`, I can test the local version of the package by running:

```bash
npm link ../path-to-create-project-calavera // in my testing playground
npm create project-calavera
```

I can now make some changes in the source code and test them immediately by running the `create` command again. This workflow is much faster than publishing to the registry and installing the package each time.

## Troubleshooting

### Broken Links (about that "generally" I mentioned before)

Sometimes the link can break, requiring you to rerun the `npm link` command. You'll know the link is broken if NPM prompts you to install the package from the registry:

```
Need to install the following packages:
create-project-calavera@0.0.5
Ok to proceed? (y)
```

### Removing Links

While there's limited documentation on unlinking packages, there are two approaches:

1. Using `npm unlink` in your test project:

   ```bash
   npm unlink ../path-to-your-package
   ```

   Note: This only removes the link in your project, not the global symlink.

2. The recommended approach - uninstall the global package:
   ```bash
   npm uninstall -g package-name
   ```
   This completely removes the symlink, ensuring that subsequent `npm create` commands will use the registry version.

## Best Practices

1. Always verify the link is working by making a small change and testing it
2. If you encounter issues, try removing the global package and relinking
3. Keep in mind that the link needs to be re-established if you switch Node versions using NVM

And that is it. You now know how to use `npm link` to test your NPM packages locally before publishing to the registry. Happy coding!
