---
title: Installing Nodejs across platforms and managing versions
description: A quick post on best practices when installing Nodejs on different platforms and managing multiple versions.
---

I wanted to call this post "Installing Nodejs across platforms and managing versions, the right way", but it seemed a little to opinionated or "douchy". I have always either installed Node from the [installer provided by the Nodejs website](https://nodejs.org/en/) or, via [Brew in macOS](https://brew.sh/). I have also used [nvm](https://github.com/nvm-sh/nvm) in the past but, I did not know that there was actually a best practice when it comes to all of this.

I learned about the best practice when studying for the [Nodejs Application Certification](https://training.linuxfoundation.org/training/nodejs-application-development-lfw211/) exam through the Linux Foundation. As it turns out, the recommended way is to either use [nvm](https://github.com/nvm-sh/nvm), or [nvs](https://github.com/jasongin/nvs) if you are on Windows. Why you may ask? Well, here is what the course material states:

- Package managers tend to lag behind the faster Node.js release cycle.
- Additionally the placement of binary and config files and folders isn't standardized across OS package managers and can cause compatibility issues.
- Another significant issue with installing Node.js via an OS package manager is that installing global modules with Node's module installer (npm) tends to require the use of sudo (a command which grants root privileges) on non-Windows systems. This is not a good security practice.
- As mentioned you can also install it via the installer provided by the Nodejs website. Again on macOS and Linux it predicates the use of sudo for installing global libraries.

It is therefore recommended to use the two tools I mentioned earlier. Before using either of the tools though, it is also recommended to uninstall any currently installed Nodejs versions on your machine.

## Using `nvm`

Once you have uninstalled any existing versions and have [installed nvm](https://github.com/nvm-sh/nvm#installing-and-updating), you can install multiple versions of Nodejs easily.

```bash
# to see all version available, run:
nvm ls-remote
```

Note that the above will output a ton off versions :) To install a specific version, you can use the following command:

```bash
nvm install 16.11.0

# or, if you want to install the latest version of a specific major version you can do
nvm install 15
```

To install the latest stable release, you can use the following command:

```bash
nvm install node
```

Here `node` is an alias for the latest stable version. Once you have installed the various versions of Nodejs you may need, you can switch to either of these using the following command:

```bash
nvm use <version>

# alternatively you can use the following the use the latest version installed on your system
nvm use node
```

When switching, `nvm` will output the version you just switched to. If you are ever uncertain of th current Nodejs version, you can use the following command to see the current version:

```bash
node -v
```

While `nvm ls-remote` will show all the available version of Nodejs, `nvm ls` will show the versions you have installed, and highlight the current active version. By default the first version of Nodejs you install will be set as your default. This means that anytime you start a new shell, `nvm` will switch to the default version. If the default is not the one you want, you can explicitly set the default as follows:

```bash
nvm alias default <version>|node
```

To uninstall a specific version, use the following command:

```bash
nvm uninstall 15
```

And that is it! You can now install, uninstall and switch between the various versions of Nodejs easily and safely.
