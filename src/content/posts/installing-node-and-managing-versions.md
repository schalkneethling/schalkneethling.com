---
title: Installing Nodejs across platforms and managing versions
pubDate: 2023-02-01
description: A quick post on best practices when installing Nodejs on different platforms and managing multiple versions.
author: "Schalk Neethling"
tags: ["nodejs"]
---

I have always either installed Node from the installer provided by the [Nodejs website](https://nodejs.org) or, via [Brew](https://brew.sh) in macOS. I have also used [nvm](https://github.com/nvm-sh/nvm) in the past but did not know that there was a best practice to guide us.

I learned about this best practice when studying for the [Nodejs Application Certification](https://training.linuxfoundation.org/training/nodejs-application-development-lfw211/) exam through the Linux Foundation. As it turns out, using a Node.js version manager is recommended. On Linux, macOS, and when using Windows Subsystem for Linux (WSL) [nvm](https://github.com/nvm-sh/nvm) is your tool of choice. If you are not using WSL, you can use [nvm-windows](https://github.com/coreybutler/nvm-windows), [nodist](https://github.com/marcelklehr/nodist), or [nvs](https://github.com/jasongin/nvs) on Windows.

## Why a Node version manager?

- Package managers tend to lag behind the faster Node.js release cycle.
- Additionally, the placement of binary and config files and folders isn't standardized across OS package managers and can cause compatibility issues.

**Most importantly:**

- When installing Node.js via an OS package manager, installing global modules with Node's module installer (npm) tends to require the use of sudo (a command that grants root privileges) on non-Windows systems. This is not a good security practice.
- As mentioned you can also install it via the installer provided by the Nodejs website, but again, on macOS and Linux, it predicates the use of sudo for installing global libraries.

> **NOTE:** The package manager the first three refer to is not the Node.js installer downloaded from the website, but native package managers such as `apt-get` on Linux.

It is therefore recommended to use the tools I mentioned earlier. Also, once either of these tools is installed, your developer experience will get a nice boost.

> **NOTE:** Before using either of the tools though, it is also recommended to [uninstall any currently installed Nodejs versions](https://stackoverflow.com/questions/11177954/how-do-i-completely-uninstall-node-js-and-reinstall-from-beginning-mac-os-x) on your machine.

## Using `nvm`

With all existing versions of Node.js removed from your computer, let's reinstall Node.js using `nvm`. The first step is to [install `nvm`](https://github.com/nvm-sh/nvm#installing-and-updating) on your machine. To test whether `nvm` has been installed successfully, run the following command in your terminal:

```bash
nvm -v # it should output something like 0.39.7
```

To see all currently installed Node.js versions run the following which might seem familiar to some:

```bash
nvm ls
```

Right now, this should not output anything. If you run the following, you will see a LOT of output. This is all of the version of Node.js that is available to install.

```bash
nvm ls-remote
```

Below is a subsection of the output:

```bash
        v20.8.1
        v20.9.0   (LTS: Iron)
        v20.10.0  (LTS: Iron)
        v20.11.0  (LTS: Iron)
        v20.11.1  (Latest LTS: Iron)
        v21.0.0
        v21.1.0
        v21.2.0
        v21.3.0
        v21.4.0
        v21.5.0
        v21.6.0
->      v21.6.1
        v21.6.2
        v21.7.0
        v21.7.1
```

The arrow indicates the currently active version. In my case, it is Node.js version `v21.6.2`.

To install a specific version, you can use the following command:

```bash
nvm install 18.16.0

# If you want to install the latest version of a specific major version you can do
nvm install 19
```

To install the latest stable release, you can use the following command:

```bash
nvm install node
```

Here node is an alias for the latest stable version. Once you have installed the various versions of Nodejs you may need, you can switch to either of these using the following command:

```bash
nvm use <version>

# Alternatively you can use the following to use the latest version installed on your system
nvm use node
```

When switching, `nvm` will output the version you just switched to. If you are ever uncertain of the current Nodejs version, you can use the following command to see the current version:

```bash
node -v
```

While nvm `ls-remote` will show all the available versions of Nodejs, `nvm ls` will show the versions you have installed, and highlight the currently active version. By default, the first version of Nodejs you install will be set as your default. This means that anytime you start a new shell, `nvm` will switch to the default version. If the default is not the one you want, you can explicitly set the default as follows:

```bash
nvm alias default <version>|node

# for example
nvm alias default 20
```

To uninstall a specific version, use the following command:

```bash
nvm uninstall 15
```

And that is it! You can now install, uninstall, and switch between the various versions of Nodejs easily and safely.
