---
layout: ../../layouts/MarkdownPostLayout.astro
title: To Polyfill Or Not To Polyfill.io
pubDate: 2024-03-06
canonical: "https://dev.to/schalkneethling/to-polyfill-or-not-to-polyfillio-5ggd"
description: The topic of Polyfill.io and its sale came across my radar about a week ago when Tobie Langel shared a link to LinkedIn on the OpenJS Foundation Slack.
author: "Schalk Neethling"
tags: ["security", "javascript"]
---

The topic of Polyfill.io and its sale came across my radar about a week ago when Tobie Langel shared a link to LinkedIn on the OpenJS Foundation Slack.

[Wesley Hales shared](https://www.linkedin.com/posts/wesleyhales_i-dont-do-these-panicky-type-of-psas-unless-activity-7167944393834885121-5hrG/):

> I don't do these panicky-type of PSAs unless it's serious, but this is a REALLY REALLY big deal because so many websites use this third party javascript library!

The sale took place on February 24, 2023, so it has been a minute. In the post on LinkedIn, there was a link provided to a [GitHub issue](https://github.com/polyfillpolyfill/polyfill-service/issues/2834), and from there I also found the [tweet (X?) from Andrew Betts](https://twitter.com/triblondon/status/1761852117579427975) strongly encouraging folks to stop using the service. At first, it sounded like the main concern here was that a Chinese company was behind the purchase. I understand that in the current world political climate, there is a "trend" to distrust anything Chinese. This however also impacts other communities such as Nigerian communities and others in Africa, India, and many developing countries. Claudio Wunder on the OpenJS Foundation Slack was the first to raise this concern which I then echoed.

As someone from South Africa, I am keenly aware of this and so, I wanted to dig in some more and understand what the larger context was.

After doing some internet sleuthing :) I discovered that the "company" who is likely behind the purchase is called Funnull and when I [visited their website](https://www.funnull.com/), well, let's just say a lot of the concerns became crystal clear. Just looking at their meta description (not translated through a tool), it reads as follows:

> 【方能 CDN】免备案 - 加速 高防 防劫持 IP 隐藏。[FUNNULL CDN] The first brand in the industry, with strong technical strength. T-level defense Effective defense against CC attacks Can test multiple sets of pricing plans.

After Tobie had some coffee he shared why he felt this was a valid concern, and what he shared made it crystal clear. Let's start with something seemingly simple, the copyright text right at the bottom of their footer.

> @2022 FUNNULL LLC Made in USA

Let's also assume the `@` instead of `©` was a typo, we all make those, but last I checked we are in 2024. Going to their [Contact Us page](https://www.funnull.com/company/contact/), they seem to have offices at "12H, Stevens Creek Blvd, Cupertino, CA, United States." However, [should you enter that into Google Maps](https://www.google.com/maps/place/Stevens+Creek+Blvd,+Cupertino,+CA,+USA/@37.322828,-122.0407283,17z/data=!3m1!4b1!4m6!3m5!1s0x808fcae11e6dc77f:0x6b59d17b29fc2331!8m2!3d37.3228238!4d-122.038148!16s%2Fg%2F11b826mw_7?entry=ttu), there is no listing for any company by the name Funnull so, "Made in USA"?

One of the other reasons highlighted by Tobie was:

> The complete lack of warning and information about the implications of the ownership transfer is very concerning.

I completely agree and this reminds me of the outrage that happened with [Audacity](https://fosspost.org/audacity-is-now-a-spyware/) [1].

And then this is a big one:

> Change in jurisdiction impacts compliance requirements around data processing (e.g. there's no EU-China privacy shield agreement that I'm aware of.)

They do have a [General Data Protection Regulation (GDPR) page](https://www.funnull.com/company/gdpr/) though, but when you read it you stumble upon this sentence.

> funnull.com is fully committed to helping you achieve compliance, so we will launch an anonymous feature before May 25, 2018, and ensure that no user identifiable data is collected or processed as much as possible.

I do not know about you, but that does not instill commitment or a sense of security and respect for user privacy in my mind. If you read a little further you will find this on the same page:

> We have thoroughly revised our user privacy and data policy

However, none of us could find a privacy or terms of service page on their website. Even that quoted line does not link to their privacy policy. That is more than enough red flags for me. If I was using the service, I would abandon it for sure.

If you read through the [GitHub issue thread](https://github.com/polyfillpolyfill/polyfill-service/issues/2834) this whole situation becomes more and more concerning almost like opening Pandora's Box.

## Just the facts

- Uncertainty about the future of polyfill.io under new ownership, particularly regarding its connection to China.
- Lack of clear communication and transparency about the ownership transfer and its implications for users.
- Concerns about potential changes to service terms without notice, affecting user trust and reliability.
- Technical issues reported by users, such as errors and bad gateway responses, possibly linked to the ownership change.
- Another [shorter GitHub thread](https://github.com/guardian/gateway/issues/2597#issuecomment-1967263479).
- Also [see Polykill](https://polykill.io/)

## What now?

Since the debacle started and exploded in the JavaScript ecosystem [Fastly](https://community.fastly.com/t/new-options-for-polyfill-io-users/2540) ([Fastly's fork of the project](https://github.com/fastly/polyfill-service)) and [Cloudflare](https://blog.cloudflare.com/polyfill-io-now-available-on-cdnjs-reduce-your-supply-chain-risk) have stood up alternatives that I would highly recommend. This shows that the open source and web ecosystem "supply chain" still has a lot of problems, edge cases, and gaping holes that need to be addressed.

It also screams that we _need_ to support those who build the projects, libraries, and services we all rely on so we can ensure a secure and sustainable future for open-source and the web.

[1] [Do decide for yourself though](https://duckduckgo.com/?q=Audacity+spuware&atb=v382-1&ia=web).
