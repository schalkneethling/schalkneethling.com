---
title: "Qilin: A Starter Project Template For Every Open Source Project"
pubDate: 2024-03-25
canonical: "https://dev.to/schalkneethling/qilin-a-starter-project-template-for-every-open-source-project-350e"
description: "Sensible defaults for your Open Source project and community."
author: "Schalk Neethling"
tags: ["open-source"]
---

Open Source is a community-based endeavor. Community is what makes Open Source possible and sets it apart from everything else. It therefore goes without saying that the success of an Open Source project is determined by the health and happiness of its community.

How welcoming an Open Source project is and how healthy and happy the community is is not a once-off task. It results from the continued effort by everyone involved and the consistent enforcement of the project’s code of conduct.

While this is true, you can get off to a great start with a project template that includes the core of what your project needs to hit the ground running.

Introducing, [Qilin](https://github.com/schalkneethling/qilin-open-source-project-starter-template/tree/main).

Consider it "sensible defaults" for your Open Source project and community. But just like sensible defaults, style rules, and best practices, these are only as good as the tools and people who enforce them.

> Did you know? No Open Source license will be approved by the Open Source Initiative (OSI) if the [license discriminates against any person, group, or field of endeavor](https://opensource.org/osd).

## README

The README.md file at the root of your project is the first stop for everyone interested in using, understanding, and possibly contributing to your project. It therefore needs special attention and is a great tool to “force” you to think about your project, its goals, and getting new users and contributors off to a great start as quickly as possible.

> NOTE: The `README-template.md` at the root of Qilin is borrowed from the much more elaborate project template from the [Cloud Native Foundation’s project template](https://github.com/cncf/project-template/tree/main) project.

Start your README with an overview of what, why, and how.

- What - What is the project?
- Why - Why does it exist? What is the problem it is trying to solve or alleviate?
- How - Is it meant to be used with another framework or library? What are the underlying technologies if interesting or important?

> Have a logo for the project? Include it here.

A great example of this is the introduction to [the Vite project](https://github.com/vitejs/vite).

> TIP: Depending on the length of your README, including a table of contents here would be a great addition. You can do this manually, or if you are using [VSCode](https://code.visualstudio.com/), you can add a TOC that automatically updates as you edit the file using the [Markdown All-In-One plugin](https://github.com/yzhang-gh/vscode-markdown/tree/master?tab=readme-ov-file#table-of-contents).

Your next task is to get the user up and running as quickly as possible i.e. getting the user to Hellow World in as few steps as possible. If relevant, including a short screencast showing the installation or the running project can be useful. but remember that this does not remove the need for written documentation.

> NOTE: Do not forget to list the project dependencies and include instructions, or links to instructions on installing and setting these up. Do not assume anything and be clear with any prerequisites the project has. This will avoid frustration for the user later on.

Some items to consider are:

- basic prerequisites
- quick installation/build instructions
- a few simple examples of use

Now that the user knows what your project is about and how to get up and running, it is time to start inviting folks to contribute.

> NOTE: While Open Source is a community thing 😃 You are not obligated to accept contributions, especially not from day one. It is much better to be clear about this and ensure a great experience for contributors when you are ready than throwing open the doors without taking the time to consider the contributor experience and whether you will have time to assist new contributors.

## Contributing

We will diverge from the `README` for a moment to talk about the `CONTRIBUTING.md` file. The first thing to consider here is that you might be talking to a different audience. In your `README` you were speaking to a user and inviting people to contribute. The person reading this is most likely interested in contributing so, you might need to consider if you want to change your verbosity (The excess use of words, especially using more than is strictly needed) in the text used in this document.

At the root of your project, you will find the `CONTRIBUTING.md` file mentioned. The first thing we want to do is welcome and thank our contributors. There is some boilerplate copy already included (heavily inspired by the [CNCF guide](https://github.com/cncf/project-template/blob/main/CONTRIBUTING.md)) which you are free to use or tweak as needed.

### How to contribute

Having welcomed the contributor we next need to explain how they can contribute. It is important to be clear and concise here. Doing so ensures that we do not waste the contributor's time and that we as the maintainer do not get inundated with pull requests and issues that are irrelevant to the project.

Some ideas of ways people can contribute:

- Builds, CI/CD, Automation
- Helping with bug fixes
- Filling issues
- Documentation
- Answering questions on GitHub Discussions or another community platform.
- Design (Does your project have a logo? Do you have a web presence?)
- Help spread the word by starring the repository, on social media, and blog posts.

If you have a community call, this would be the next section to include here. Highlight aspects of the call such as:

- Whether it is public (Can people turn off their webcam?)
- Whether it is recorded
- If it is recorded, how are recordings accessed?
- If it is a standing call with an existing time and day, you can include those here.

> TIP: If the calls are public and/or recorded, please remember that not everyone will be comfortable with this so, ensure that you offer these folks a way to participate asynchronously. It is generally a good idea to offer an alternate way to participate as access to fast, reliable, and cost-effective internet access is still not a given to everyone across the globe.

### Finding issues to work on

Next, we want to tell people where to find issues to work on. This could be the issues tab for the project but, perhaps you use something like Trello that is external to the repository. This is the place to tell people about this.

Next is the question of labels. This is often overlooked when starting a project but can make a big difference to potential contributors (and maintainers by the way). Over and above a clear and maintainable labeling strategy consider how you label issues specifically for new contributors.

You can either use a global `good-first-issue` or `help-wanted` label or, you can separate issues into two buckets. One bucket (`first-timers-only`) is carefully curated for those contributing to the project for the first time. A contributor can only ever work on one of these and they are meant to give the contributor an easy on-ramp into the project and are not merely based on complexity. You could then have a second bucket of issues chosen based on complexity and marked as `good-first-issue`. It is up to you to decide whether or not contributors can pick up more than one of these issues.

Most importantly, do not overcomplicate this for you or your contributors. It is better to be consistent. Also, be clear which issues are available to be worked on. The last thing you want is for two contributors to open a pull request for the same issue.

### Getting help

While you have taken great care to ensure that the issues filed are clear and have actionable steps, people are bound to run into challenges or have questions while working on them. The next section then lists the best places people can ask questions and get support.

There are no hard and fast rules around this other than remembering to meet your users and contributors where they already are. If you know that they are more likely to hang out on [Discord](https://discord.com/) rather than [Slack](https://slack.com/), then having your community channel on Discord is going to serve you well. Some people prefer to keep their communication about a piece of work as close together to the issue and work as possible. One place to have these asynchronous conversations is on the issue itself. There are a few benefits to this:

- It is clear that the issue is being worked on.
- All the context and decisions concerning the issue are in one place making it much easier for someone else to pick up the issue should the person who originally worked on it not be able to complete the work.
- It sets an example for others.

[GitHub Discussions](https://github.com/features/discussions) can also be a great place for support as long as these are regularly monitored. Another option along the same lines is [Discourse](https://discourse.org/) and the Open Source [Matrix](https://matrix.org/) which is used by quite a few Open Source and community-based projects.

Some examples of the above:

- [MDN Web Docs GitHub Discussions](https://github.com/orgs/mdn/discussions)
- [WHAT-WG on Matrix](https://matrix.to/#/#whatwg:matrix.org)
- [SustainOSS on Discourse](https://discourse.sustainoss.org/)
- [Mechanical Ink Studio on Slack](https://join.slack.com/t/mechanical-ink-group/shared_invite/zt-22yg9uryr-YiNd2tO1E5qrckQldruWsw)

### Pull requests and review

What is included here will greatly depend on the project and the potential complexity of the contributions made. As included in the template, I would encourage everyone to always include these three items at the very least:

- Be patient. Your contributions are important, and we will do our best to review them in a timely manner.
- Be responsive to feedback from maintainers.
- Don't hesitate to seek help if needed.

If there are specific automation that runs when a pull request is opened that the contributor should pay attention to, call these out and explain how to understand and address the feedback given by these tools.

### The development environment

The time has come to guide your contributors in setting up their development environment. Depending on the nature of the project, this may or may not be similar to what you included in the `README` for the project. As mentioned previously, you could be less verbose here but aim to make your steps clear and ensure that you work through the steps yourself to ensure everything works as described.

Some things to keep in mind:

- Try to avoid complex language as the reader’s first language might not be English.
- If prior knowledge or experience is needed, state this clearly and early.
- If possible, keep what is needed on the contributors' computers to a minimum. Not everyone has high-speed internet access and unlimited bandwidth. Can someone contribute to the project using an online development environment such as Gitpod or GitHub Codespaces? If they can, make mention of it in the documentation.
- As before, try to avoid making too many assumptions about the experience level of the contributor.

The VSCode project has an [incredibly detailed document detailing how to contribute](https://github.com/microsoft/vscode/wiki/How-to-Contribute).

### Signing commits

If your project requires signed commits, mention this clearly and link to this valuable document on GitHub Docs explaining [how a user can configure signed commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits).

What are signed commits and why should you require them? Alessandro Segala wrote a great post about this so I will [point you there](https://withblue.ink/2020/05/17/how-and-why-to-sign-git-commits.html).

## Back to the README

That was quite a lot, but it is critical to ensure this is set up well for both you as the maintainer and potential contributors. With the document ready, link to it in your `README`.

Next in your `README` is the communication section. Depending on your project, this may be the same information you added to the `CONTRIBUTING.md` document or there may be additional channels meant specifically for end-user support.

Are there other helpful resources such as blog posts, tutorials, videos, etc. made by yourself or the community? The resources section is the perfect place to link to these and encourage the community to contribute in this way.

### License

Next is the all-important license for your project. Which license you choose to use for your project is up to you and the project's intent. It is important to take a long-term view here as the last thing you want to do is choose a very open license only to want to close things down later.

Whatever you choose to do, always:

- Choose an Open Source Initiative-approved license, and
- Add a LICENSE file with your chosen license to your repository

A repository without a license is not Open Source. In fact, if your project does not contain a license, it is governed by the terms and conditions of the platform on which you host your code. If in doubt, the [MIT](https://opensource.org/license/mit) and [Mozilla Public License](https://opensource.org/license/mpl-2-0) are good general-purpose licenses and for a more enterprise-friendly license, the [Apache 2](https://opensource.org/license/apache-2-0) license works well.

### Code of conduct

Last, but definitely not least, we add a link to the project’s code of conduct. This document signals that you are and have thought about the health and longevity of the project and the community. This is also the document that each and every member, including owners and maintainers, needs to be held to when interacting and representing this project.

While you are free to write your own or adopt one from another repository, project, or organization you respect, there exists a code of conduct written and maintained by the community known as the [Contributor Covenant](https://www.contributor-covenant.org/).

It is the one used by this project and the template that is available for you to use. Three things:

1. Please do read the code of conduct as it governs you as the owner as much as fellow maintainers and contributors. It is therefore critical that you understand and agree with everything that is set out in the agreement.
2. Please ensure that you enforce the codes of conduct fairly and equally.
3. Ensure you update the contact method listed in the code of conduct document to reflect the best way to raise violations. When doing so, keep in mind the privacy of the reporter.

While not required, I like to include the first three do’s and don’ts from the code of conduct directly in the `README` under the code of conduct heading. This is how the `README` template is set up, but feel free to amend it to your preference.

## BONUS: Project settings using settings.yml

Through the use of the [repository settings GitHub app](https://github.com/repository-settings/app) (not an official app made by GitHub), you can preconfigure some of your repository’s settings through the use of a `settings.yml` file located inside the `.github` folder of the repository.

> NOTE: Please ensure that you [read and understand the security implications](https://github.com/repository-settings/app?tab=readme-ov-file#security-implications) before using this functionality.

> NOTE: For available settings, you can configure [read the following documentation](https://github.com/repository-settings/app/blob/master/docs/configuration.md) on GitHub.

You can see the defaults that will be [set by this template here](https://github.com/schalkneethling/qilin-open-source-project-starter-template/blob/main/.github/settings.yml). The app is run every time it detects a change to the `settings.yml` file. Once you have created a new project using the template, you only need to update the description, homepage, and topics properties.

Labels are merged with existing labels. This means that existing labels will be updated and new labels will be added. None of the default labels added by GitHub will be deleted.

### Conclusion

Using this template and the advice provided here you will have laid the groundwork for a great open source project for you and your potential users and contributors. All that is left is to make something great and then support your users and community through humility, kindness, and mutual respect.

> Oh! And you are going to need to [take care of the security](https://dev.to/schalkneethling/6-tools-to-help-keep-your-dependencies-and-code-more-secure-13mi) of your project and its users.

If you found this useful and ended up using the repository template, please let me know and star Qilin on GitHub! ⭐️ Thank you. 🙏

### Resources

- [The CNCF project template](https://github.com/cncf/project-template/tree/main). The original inspiration for this repository.
- [Repository settings app](https://github.com/repository-settings/app).
- [OpenSource.guide](https://opensource.guide/)

Start contributing. 🙌

Here are some projects you may want to consider contributing to:

- [MDN Web Docs](https://github.com/mdn/content)
- [freeCodeCamp](https://github.com/freeCodeCamp)
- [GitHub Docs](https://github.com/github/docs)
- [Developer Toolchest](https://github.com/schalkneethling/developer-toolchest)
