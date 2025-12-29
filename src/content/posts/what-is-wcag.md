---
title: "What is WCAG? - A Brief Overview"
pubDate: 2025-02-06
description: "Learn about WCAG (Web Content Accessibility Guidelines), including WCAG 2.2 principles, conformance levels, and upcoming WCAG 3 changes, plus insights on accessibility certification value."
author: "Schalk Neethling"
tags: ["frontend-engineering-explained", "accessibility"]
---

As mentioned [in an earlier post](the-journey-to-iaap-was), I am currently (February, 2025) studying for the Web Accessibility Specialist certification. This is a certification offered by the International Association of Accessibility Professionals (IAAP).

## A Note on Certifications

While a lot of negative sentiment has been expressed concerning certifications especially in the web accessibility space, I want to take a moment to share my thoughts on the matter before digging into the topic of this post. I want to start by stating that I generally agree with the statement. I have been involved with web accessibility for quite some time now and have never been certified. Does that mean my voice is less credible than someone with a certification? I don't believe so.

I have worked with, and learned from, some amazing people in the web accessibility space who do not have a certification. I have also worked with, and learned from, some amazing people who do have a certification. For me, being certified was not a qualifying criteria, proven experience and knowledge sharing was. Web accessibility is also nuanced and there is a lot to be learned from people's lived experience which does not require a certification to be validated.

I also have concerns around certifications and its monetary cost. I hate (strong word I know) when technology, knowledge, and work opportunities are gate kept due to an individuals financial constraints. I do not support nor condone this, and to be honest, this goes against the whole idea of accessibility more generally. I want to live and work in a world where people are included and _not_ excluded for participating due to their current financial situation.

### So why I am doing it then?

The first is personal and talks to my mental makeup and my lack of self-confidence also known as [imposter syndrome](https://health.clevelandclinic.org/a-psychologist-explains-how-to-deal-with-imposter-syndrome) (I am working on that one 😁). But, it also speaks to the social influence that have for the longest time required some form of external proof-of-knowledge. These proof-of-knowledge requirements have largely been dismantled in tech by proof-of-work, but I would sadly be lying if I said having a certification is of little or no value.

The second is more of a business reason. I joined [Factorial Gmbh](https://www.factorial.io/en) in May 2024, and one of the many reasons I was attracted to Factorial was their focus on accessibility. But more than a focus, they have a commitment to accessibility. They have a team of people who are passionate about accessibility and are actively working to make the web a more inclusive place.

However, when a client considers two proposals, one from a company with a team of people passionate about accessibility and another from a company with a team of people who, may or may not be passionate about accessibility, but have members who are certified, which proposal do you think they will choose? The non-pragmatic side of me will say, well then do we want to work with this client? But the pragmatic side of me says, well, we need to pay the bills, keep the lights on, and grow potentially grow our company.

Also, if we as a company are flourishing, we can choose to pick up projects that are good for the soul and not merely focus on good for the bottom line. So we need to find a balance. But there is something else here that is hidden in the details. There is a cost to the company to have people certified. This is not just the cost of the certification, but the time spent studying, the time spent writing the exam, and the time spent maintaining the certification. This is a cost that is not just financial, but also a cost in time and energy. This is a cost that is not just borne by the individual, but also by the company.

For a company to therefore _choose_ to invest in its people in this way, shows their commitment to their employees and the work they do. It is also a signal to potential employees and clients that the company cares enough to invest in their people. #notsponsored 😁

I hope that this provides some clarity on why I am doing this certification. With that said, let's dive into the topic of this post.

As part of my preparation for the Web Accessibility Specialist certification, I've been diving deep into the Web Content Accessibility Guidelines (WCAG). Understanding these guidelines is fundamental not just for passing the certification, but more importantly, for creating truly accessible web experiences. Let me share what I've learned about WCAG and why it matters for everyone working in web development.

## What is WCAG?

WCAG stands for Web Content Accessibility Guidelines and is a standard that is maintained by the World Wide Web Consortium (W3C). The guidelines are a set of recommendations for making web content more accessible to people with disabilities. At the time of writing (February, 2025) the latest version of the guidelines that is at W3C recommendation status is WCAG 2.2, with WCAG 3 being in working draft form.

WCAG 2.2 is made up of 13 guidelines organized under 4 principles. For each guideline there are a set of success criteria, which are testable statements that are used to determine if a website meets the guideline. The success criteria are further organized into three levels of conformance: A, AA, and AAA. Level A is the minimum level of conformance, level AA is the standard level of conformance (what we should be aiming for), and level AAA is the highest level of conformance. It is not a linear scale though, there will be times when one can easily meet AAA for some success criteria, while achieving AA might be a challenge for other success criteria.

For example under Guideline 2.4 &mdash; Navigable, success criteria 2.4.8 Location (AAA), specify the following:

> Information about the user's location within a set of Web pages is available.

This can be achieved by adding a breadcrumb trail to all pages and providing a sitemap. If one then refer to Guideline 1.2 &mdash; Time-based Media, success criteria 1.2.5 Audio Description (Prerecorded &mdash; AA), specify the following:

> Audio description is provided for all prerecorded video content in synchronized media.

Be careful here, audio descriptions are not a mere transcript and therefore go beyond captions. Imagine a scene where a character silently walks into a dark room, trips over a cat, and falls with a loud crash.

Captions would show:

```bash
[Loud crash]
"Ouch!"
```

Audio description would say:

```bash
John enters the dimly lit living room. He doesn't notice the black cat curled up on the floor. His foot catches on the cat and he stumbles forward and falls to the floor with a loud crash.
```

Clearly meeting this AA level success criteria for time-based media will be much harder than meeting the AAA level success criteria for location. This is why it is important to understand that the conformance levels are not a linear scale and also not always applicable.

Similarly WCAG 2, 2.1, and 2.2 are not mutually exclusive and each an isolated standard, but instead, each build on the previous and is fully backwards compatible. This means that if you meet WCAG 2.2, you also meet WCAG 2.1 and WCAG 2.0. At this point it is also important to say that meeting WCAG does not mean that your website or web application is accessible. One also need to consider the user experience, usability, and performance of the website or web application as contributing factors that makes a website or web application accessible and inclusive.

### A Note on the Legal Side

It's important to note that WCAG guidelines have been widely adopted into legal frameworks worldwide. For example, in the European Union, the [EN 301 549 standard references](https://en.wikipedia.org/wiki/EN_301_549) WCAG 2.1 Level AA for public sector websites. In the United States, [Section 508 of the Rehabilitation Act](https://www.section508.gov/content/guide-accessible-web-design-development/) incorporates WCAG 2.0 Level AA standards, while many legal settlements and court decisions have referenced WCAG 2.1 as a technical standard. [Australia's Disability Discrimination Act (DDA)](https://humanrights.gov.au/our-work/disability-rights/world-wide-web-access-disability-discrimination-act-advisory-notes-ver#whatis) also recognizes WCAG as providing guidance for web accessibility compliance.

However, legal requirements can vary significantly by jurisdiction and sector (public vs. private), so organizations should consult local regulations and legal counsel for specific compliance requirements.

### The Four Principles

As mentioned the 13 guidelines are organized under 4 principles that make up the acronym POUR. POUR stands for Perceivable, Operable, Understandable, and Robust. Under each of these are the guidelines and related success criteria that addresses each of this principles.

In short:

Perceivable is about ensuring that your content can be accessed and understood by all users irrespective of how they choose to access your content or application. This includes topics such as:

- Providing alternative text for images
- Providing captions for videos
- Ensuring that text has sufficient contrast

Operable concerns itself with ensuring that users can interact with your content and application. This includes topics such as:

- Ensuring that all functionality is available via the keyboard
- Ensuring users are given enough time to interact with content (this is something that is often overlooked)
- Avoid animations that can cause seizures or trigger physical reactions (think respecting a user's preference for reduced motion as an example)

Understandable is about ensuring that your content and application is understandable and predictable. This includes topics such as:

- Consistent navigation
- Clear and concise content (the language you use should be easy to understand)
- Assist users when completing forms with an aim to avoid mistakes and provide appropriate guidance when errors do occur

Robust is about ensuring that your website or application works well today, in the future, and when accessed using different devices and technologies. This includes topics such as:

- Responsive design
- Ensuring that your website or application is compatible with different browsers and assistive technologies

## WCAG 3

[Semantic versioning](https://semver.org/) (or semver for short) defines some rules for what changes to a version number signal. Change to the last last number (e.g. 1.0.0 to 1.0.1) signals a patch, a change to the middle number (e.g. 1.0.0 to 1.1.0) signals a minor change, and a change to the first number (e.g. 1.0.0 to 2.0.0) signals a major and often breaking change.

If we apply this versioning scheme to WCAG then WCAG 3 is a major, and in some ways breaking, change to the WCAG standard. While WCAG 3 is similar to WCAG 2 in its goal of providing guidance on making web content and apps more accessible for people with disabilities, it will have some notable differences. One change that is not immediately obvious is the WCAG 3 uses the same acronym as WCAG 2, but stands for Web Accessibility Guidelines, dropping Content from the meaning. The reason for the change is because with WCAG 3 the scope of the guidelines will expand to cover more user needs, including the needs of users with cognitive disabilities. The goal is also for WCAG 3 to be more easily understandable and for it to be more flexible.

The reason for sticking with the WCAG acronym as opposed to changing to WAG 3 is because the WCAG acronym is widely recognized and used. Another aspect of WCAG 3 that will differ greatly is the conformance approach. Today we have guidelines, divided into principles, success criteria with different conformance levels. While this is still very much exploratory, WCAG three is considering having Foundational Requirements (this will comparable to today's AA conformance level), Supplemental Requirements, and Assertions. If you are curious, you can find [more information as part of the WCAG 3 draft documentation](https://www.w3.org/TR/2024/DNOTE-wcag-3.0-explainer-20241212/#conformance-models).

WCAG 3 is not expected to be ready for several years, and even when it has reached recommendation level, WCAG 2 will not be deprecated for several years after that.

---

I hope this post has provided you with a good overview of what WCAG is and what it aims to achieve including a sneak peek into the future of the Web Accessibility Guidelines. Please refer to the resources below for additional reading. Until the next post, take care and let's all commit to building an accessible web for everyone.

### Resources

- [WCAG 2.2 Standard](https://www.w3.org/TR/WCAG22/)
- [How to meet WCAG Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?versions=2.2)
- [WCAG 3 Working Draft](https://www.w3.org/TR/wcag3/)
