---
layout: ../../layouts/MarkdownPostLayout.astro
title: Why I Care Deeply About Web Accessibility And You Should Too
pubDate: 2024-03-31
canonical: "https://dev.to/schalkneethling/why-i-care-deeply-about-web-accessibility-and-you-should-too-274a"
description: "In this post, I discuss why I care deeply about web accessibility, emphasizing its importance in ensuring equal access for people with disabilities and removing barriers to interaction with websites and applications."
author: "Schalk Neethling"
tags: ["accessibility"]
---

When I talk about web accessibility I tend to take a pretty broad view. Technically, you could separate it into two parts:

- inclusive design and,
- digital accessibility

You can further separate digital accessibility into a narrower category called web accessibility which is my primary focus and where my skills are.

[Sara Soueidan](https://www.sarasoueidan.com/) defines Web Accessibility as follows:

> "Web accessibility design is about ensuring equal access for people with disabilities. It is about removing barriers to access, so that people with disabilities can perceive, understand, navigate, and interact with websites and applications. It addresses issues specifically related to disability, and it does not try to address broader issues."

What I love about this is its focus and the clarity of intent. I also love this age-old quote from [Sir Tim Berners-Lee](https://en.wikipedia.org/wiki/Tim_Berners-Lee) (The father of the World Wide Web):

> "The power of the Web is in its universality. Access by everyone regardless of disability is an essential aspect."

## A Broader View

Why I am sticking to a broader view is somewhat personal. As someone living in South Africa, a developing country (although some people will tell you differently), I encounter additional barriers to getting the full benefit of the internet. While not specifically related to someone’s physical or mental abilities per se, I consider them barriers to access.

An example of this is web performance. The indiscriminate use of web technologies that end up delivering massive payloads to end users on low-end devices with either slow internet access or capped internet bandwidth allowances creates a massive barrier to access. When these same web properties then add additional dependencies to polyfill several modern JavaScript, CSS, or HTML features, the problems for these people are multiplied.

Depending on how you [ship these polyfills](https://dev.to/schalkneethling/to-polyfill-or-not-to-polyfillio-5ggd), you may even open up a security risk for them. There is a reason there are best practices such as [progressive enhancement](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement) and [local first](https://localfirstweb.dev/). Is this always possible? Probably not, but does that mean we throw out the baby with the bathwater? I do not believe that is a good approach.

Have you tried accessing and using the internet while on a 3G connection? For many people in developing countries, this is their reality and their only means of accessing this valuable resource.

For many others, depending on the time of day or infrastructure conditions, this can be your reality as well. When my only means of accessing the internet was through LTE, I often missed meetings with my co-workers or could not participate as my connection was simply too unstable to handle video streaming. This makes one feel excluded from your own team and causes stress and frustration.

Later when I got access to 5G I thought my problems were a thing of the past. However, for one thing, these connections are not as stable as the providers would like you to believe due to the slow rollout of 5G towers. In addition, when we have [prolonged load shedding](https://www.bbc.com/news/world-africa-65671718) (very common in South Africa but not unique to South Africa) the towers would power down to conserve battery power and often go offline completely. This could be due to four hours of power cuts or sometimes, because the battery backup was stolen and the nearest tower is offline. As you may know, while 5G is fast, it relies on many towers closely deployed. When you lose one or more of these, your connection may fall back to LTE, or in some cases 3G.

Say what you will about meetings, but when your voice is excluded due to a lack of access to stable infrastructure, this can feel very much like a situational disability. Today, I have a fiber-to-the-home connection of around 200Mbps, but this is a privilege not afforded to everyone.

Now let me be clear. I do not expect the world to always cater to the lowest denominator, but I feel that these considerations are not even considered when services are developed and deployed. This is often the result of the “work’s on my machine” problem for which I am as guilty as anyone else. I try my damndest to keep this in mind, test for it, speak about it, and write about it, but we are all imperfect human beings.

But we must keep talking, writing, and thinking about it because, just like the [curb-cut effect](https://ssir.org/articles/entry/the_curb_cut_effect), not everyone can be expected to be aware of these scenarios playing out in modern societies today.

## Access To Internet Services

Another topic I consider an accessibility challenge is access to the same services globally. One that has been bugging me for the longest time is Stripe. While I believe some form of Stripe is now available to developers in South Africa, there are still vast areas globally where developers cannot use Stripe to accept payments.

With a URL like [stripe.com/global](https://stripe.com/global), you would think it would embrace the meaning of the word global. Alas, that is not the case. The main tagline on this page reads, “Accept payments from anywhere in the world”. Now I know that this is carefully chosen and is technically true. For those who can integrate Stripe for payment processing, you can indeed accept payments from anywhere in the world. However, not everyone can use Stripe to accept payments from anywhere in the world. This is not unique to Stripe as PayPal is also not available everywhere, but this problem also affects other areas.

For example, if you are in a country where you can accept Stripe and are publishing a newsletter through, Substack or using the [Ghost platform](https://ghost.org), enabling the ability to accept payments is a few clicks away. For those who cannot accept payment with Stripe, well, you are up the creek without a paddle. I do not know about you, but I see that as a barrier to access.

## AI

When artificial intelligence, or more specifically, generative AI boomed in early 2023 I was both amazed, excited, and concerned. The technology itself is pretty darn impressive, and I can see a lot of potential in its use in analyzing and making sense of very large datasets. Highlighting anomalies that would take us months or years. This can have far-reaching impacts from health research to addressing the climate crisis.

There are also day-to-day benefits that can make us more productive and rid us of mundane and repetitive tasks that are part of many people’s day-to-day work. I am not saying that it could or should eliminate jobs entirely, but it frees up time to focus on more interesting and fulfilling work. Also, some of these generative technologies can open new doors for people.

However, what I quickly noticed was the astronomical pricing of these services. None of these services offered [purchasing power parity pricing](https://en.wikipedia.org/wiki/Purchasing_power_parity) either so, those who could not afford it were simply excluded from this innovation. This stoked fears in me of a new digital divide when we have not even fully addressed the initial divide. For a technology to be truly transformative it needs to be accessible and have the potential to positively impact the lives of everyone, not merely a subset of the world.

This is thankfully being alleviated to some extent by the open-source ecosystem and hubs such as [HuggingFace](huggingface.co/). This, however, resurfaces a problem I mentioned earlier. These all rely on an internet connection. Depending on what you are trying to do, a fast one with quite a bit of available bandwidth.

The user experience layer that many of these aforementioned services have spent a lot of time on is missing from most of the open-source offerings. Not an insurmountable problem, but yet more hoops to jump through for those already stretched for time and resources.

Let’s not talk about local models as the hardware requirements are way beyond most of these people’s reach. I have a MacBook Air with an M2 chip and 8GB of RAM and can hardly run [Whisper](https://github.com/openai/whisper/) locally, so I use [this HuggingFace space](https://huggingface.co/spaces/hf-audio/whisper-large-v3).

## The Web

This brings us full circle and back to the web. And here I want to share a story I encountered a few days ago at the bank.

My daughter and I arrived at the bank branch, our scheduled 1 PM appointment time was more of a formality than a guarantee. As we settled into the waiting area, the first queue progressed swiftly, and we found our seats inside. While generally accommodating, the low-slung chairs posed a challenge for some.

Across from us sat an elderly couple, the husband's visible discomfort and strain evident. Between them lay a set of crutches, a poignant reminder of the difficulties he faced. I assumed the prolonged wait exacerbated both his stress and pain.

Finally, their turn arrived after an hour's passage. Steadying himself with great effort, the gentleman tentatively made his way to the counter, his wife's support aiding each arduous step. The cramped quarters offered little respite as he carefully lowered himself onto a utilitarian plastic chair.

Mere minutes later, he bravely rose once more, navigating some 15-20 steps to a nearby photo booth at the clerk's behest. Thankfully, friendly bystanders assisted the couple, ensuring the husband could complete this task. Upon his return, a simple signature on a tablet sufficed, and he opted to stand, the clerk empathetically allowing this concession.

At last, they were done, and I watched as visible relief washed over the couple's faces after enduring such an unnecessarily burdensome process. Their palpable emotions spoke volumes about the barriers they had valiantly, yet avoidably, surmounted that day.

My question is, is this not something technology and the web is supposed to have solved? There should be no need for this person to make their way to a bank in a shopping mall, wait for more than an hour, and then be asked to walk back and forth to renew or apply for a new identity card. With a web browser, an internet connection, and a webcam this person could have done everything including the digital signature from the comfort of their home.

While this was all taking place there was a mother with a baby waiting in line. The baby was clearly tired and was not having any of this. Yet another person who should not need to have come to the bank if they had access to the technology mentioned before. And for those who do not have access to the technology, there should be affordances made to ensure they can be helped in the most efficient means possible.

## My mission statement concerning web accessibility

Therefore, my passion for accessibility stems from experiencing accessibility barriers personally, observing their impact on others, and holding the conviction that technology should tear down divides - not erect new ones. I want to fulfill, and help you fulfill, the web's promise of equal access and opportunity for everyone, regardless of circumstances. Digital accessibility should not be an accommodation but a fundamental right and prerequisite for technology to truly better humanity.

### Conclusion

Like AI, the web and technology in general have the potential to change lives and empower people to take control and ownership of their own lives, but only if we are mindful when designing and building web experiences and applications. These tools and technologies become truly powerful when they are available to benefit all humanity and not only a select few.

Therefore, as a web developer, it is your responsibility to ensure that you learn and understand HTML and use all it has to offer. It is critical that you familiarise yourself with the [web content accessibility guidelines](https://www.w3.org/WAI/standards-guidelines/wcag/) (WCAG) and when and how to use [ARIA](https://www.w3.org/WAI/standards-guidelines/aria/)(Accessible Rich Internet Applications). Over and above it all, take the time to consider how your choices might be excluding the very people who could benefit from the service, website, or application you are building.

Also, do not be afraid to ask for help and take the time to read more about the curb-cut effect to understand how affordances for seemingly one group, can end up benefitting everyone.

---

Why is accessibility important to you? What are some questions you have about web accessibility? What one thing can you do today to make something you have built or are building a little more accessible?
