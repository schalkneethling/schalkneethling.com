---
title: "Unicode character class escapes. A Hidden JavaScript Superpower"
pubDate: 2026-07-01
description: "Unicode character class escapes turn regular expressions from English-only ASCII tools into something that understands the whole of human writing. A look at how `\\p{L}`, `\\p{N}`, `\\p{Sc}`, and the `v` flag's properties of strings make this possible."
author: "Schalk Neethling"
tags: ["javascript", "frontend-engineering-explained"]
standardSite:
  publish: true
  documentAtUri: at://did:plc:brimpw7k46xczmr4pqst45df/site.standard.document/3mrdktcrds227
---

I will admit something up front: I am not a regular expression wizard 🧙. Like a great many developers, I find regular expressions equal parts useful and intimidating, and I reach for them with the cautious respect one might reserve for a sharp kitchen knife. What I do recognise, however, is when an addition to the language makes regular expressions meaningfully better. Unicode character class escapes are one of those additions, and once you have seen what they do, it is hard to imagine how we have survived without them.

This post is about why `\p{...}` and its inverse `\P{...}` deserve a permanent place in your toolkit, what the world looks like without them, and where the newer `v` flag takes things next.

## The pattern that started it all

Here is the regular expression that prompted me to write this post:

```js
const trimmed = input.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
```

It trims leading and trailing characters that are not letters or numbers. Seems simple. You might appreciate how few characters this took. But at the same time, you might be wondering why I would start the post with something you have likely done many times before. However, the devil is in the details. There is an easy-to-miss `u` in the code above that opts us into Unicode mode, which in turn enables these special property escapes. With this in place, `\p{L}` matches any letter, in any script, and `\p{N}` matches any numeric character, in any numbering system. Not just English, or ASCII.

Before going further, it is worth unpacking where those short names actually come from, because the shorthand warrants a small tour through the Unicode Standard. The long form of `\p{L}` is `\p{General_Category=Letter}`. Unicode organises every code point into a General Category — Letter, Number, Punctuation, Symbol, Mark, Separator, and so on — and the property escape syntax lets you match against any of them. Because General Category is the default property when no property name is supplied, we can drop the `General_Category=` prefix and write `\p{Letter}`. Each category then has a canonical short alias — one letter for the top-level categories like Letter, and two letters for the more specific subcategories we will meet later. That gives us the final form: `\p{L}`. The same applies to `\p{N}`, which expands to `\p{General_Category=Number}`, then `\p{Number}`, then the alias. All three forms are legal, and all three mean exactly the same thing. Short, medium, or long — pick whichever reads best to whoever will maintain the code.

There is also a capitalised counterpart worth knowing about: `\P{...}`. Where `\p{...}` matches any code point that has the given property, `\P{...}` matches any code point that does not. So `\P{L}` is "not a letter", and `\P{N}` is "not a number".

This is exactly why the trim pattern at the top of the post uses lowercase `\p` inside a negated character class (`[^\p{L}\p{N}]`) rather than the more English-sounding `[\P{L}\P{N}]`. It is easy to miss the leading `^` on a quick read, and easier still to reach for `\P` on the assumption that "not letter, not number" is a straightforward translation. However, it is not: the `\P` version would eat almost the entire string. Match the positives with lowercase `\p`, negate the whole class with `[^...]`, and you get the behaviour you actually want.

Both the property names and their aliases are defined in the Unicode Character Database (UCD), a set of plain-text files that the Unicode Consortium publishes and updates with each release of the standard. Two of these files are worth pointing at directly: [`PropertyAliases.txt`](https://www.unicode.org/Public/UCD/latest/ucd/PropertyAliases.txt), which lists property names and their aliases (this is where you would find `General_Category` aliased to `gc`), and [`PropertyValueAliases.txt`](https://www.unicode.org/Public/UCD/latest/ucd/PropertyValueAliases.txt), which lists the values each property can take and their aliases (this is where `Letter` is aliased to `L`, `Number` to `N`, and so on). The actual mapping of code points to those values — which characters are letters, which are numbers, and so on — lives in other UCD files. The ECMAScript specification pins each release to a specific Unicode version, and any engine that claims support for Unicode character class escapes must match the classifications defined there. That is a rather satisfying thing to know as you type `\p{L}` and get on with your day.

Try it on a few inputs, and the results may surprise you:

```js
"  ¡Hola, mundo!  ".replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
// → "Hola, mundo"

"…東京タワー、".replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
// → "東京タワー"

"٢٠٢٦?".replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
// → "٢٠٢٦"
```

Spanish punctuation, Japanese full-width punctuation, Eastern Arabic digits — all handled without a single explicit mention of any of them. The pattern is short, the intent is obvious from the names of the properties, and crucially, it stays correct as the Unicode Standard grows. When a new script lands in a future Unicode release, this pattern already supports it.

To appreciate just how good a deal this is, it is worth looking at what we would have to write otherwise.

## The English-only equivalent

The shortest "equivalent" version, the one that gets written by reflex, looks like this:

```js
/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g;
```

It is shorter, it is familiar, and it is quietly broken the moment input strays outside ASCII. Run it against `"café!"` and you do not get `"café"` back, you get `"caf"`, because `é` is not in `A-Za-z` and therefore matches `[^A-Za-z0-9]` right alongside the exclamation mark. The same fate awaits `"naïve."`, `"Ω is omega"`, `"Привет!"`, `"東京、"`, `"٢٠٢٦?"`, and effectively every string that real users are going to type. Worth noting in passing: in this specific ASCII-only pattern, the `u` flag is no longer required, since there is nothing Unicode-aware left to enable. Any time you do want Unicode mode — and therefore access to `\p{...}` — the `u` flag (or its successor, `v`, which we will get to later) is what turns it on.

## What it takes to do this by hand

The honest comparison is not against the broken ASCII version. It is against an attempt to actually replicate what `\p{L}\p{N}` does without using property escapes. That means enumerating Unicode code point ranges for every script and digit block you intend to support. A partial effort covering Latin, Greek, Cyrillic, Armenian, Hebrew, Arabic, Devanagari, common CJK Unified Ideographs, Hiragana, Katakana, Hangul, and the matching digit blocks looks something like this:

```js
/^[^A-Za-z0-9\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u0370-\u03FF\u0400-\u04FF\u0500-\u052F\u0531-\u0556\u0561-\u0587\u05D0-\u05EA\u0620-\u064A\u0660-\u0669\u06F0-\u06F9\u0904-\u0939\u0958-\u0961\u0966-\u096F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7A3]+|[^A-Za-z0-9\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u0370-\u03FF\u0400-\u04FF\u0500-\u052F\u0531-\u0556\u0561-\u0587\u05D0-\u05EA\u0620-\u064A\u0660-\u0669\u06F0-\u06F9\u0904-\u0939\u0958-\u0961\u0966-\u096F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7A3]+$/g;
```

And it is still wrong. It silently omits Latin Extended Additional (`\u1E00–\u1EFF`, which is where Vietnamese lives), the Cyrillic Extended blocks, Bengali, Tamil, Telugu, Kannada, Malayalam, Thai, Lao, Georgian, Ethiopic, the Arabic Supplement and Presentation Forms, the various other-script digit blocks (Bengali `\u09E6–\u09EF`, Tamil, Thai, and so on), the CJK Extension blocks, and the entire supplementary plane, which is where emoji and historic scripts live. Each of those gaps is a real user whose name or content gets mangled by the trim function.

It is also unreadable, unmaintainable, and frozen in time. The Unicode Standard adds scripts and characters with every release. `\p{L}` and `\p{N}` track those additions automatically, the hand-rolled monstrosity does not. A handful of characters versus several hundred, and the handful is the one that is actually correct.

That is the case for Unicode character class escapes in a single comparison. Once you have understood it, the broader catalogue becomes a lot more interesting.

## Currency symbols with `\p{Sc}`

Letters and numbers are the obvious win. Currency symbols are our next win. Following the same path we walked with `\p{L}`, the long form here is `\p{General_Category=Currency_Symbol}`, which shortens to `\p{Currency_Symbol}` once we drop the default `General_Category=` prefix, and finally to the two-letter alias `\p{Sc}` — where the `S` stands for Symbol and the `c` for currency. Symbol is the parent category, and currency symbol is one of its subcategories, alongside math symbols (`Sm`), modifier symbols (`Sk`), and the catch-all other symbols (`So`).

The pattern itself is compact:

```js
const text = "Prices: $9.99, €12,50, £8, ¥1200, ₹450, ₽300";
[...text.matchAll(/\p{Sc}\s*\p{Nd}+(?:[.,]\p{Nd}+)*/gu)].map((match) => match[0]);
// → ["$9.99", "€12,50", "£8", "¥1200", "₹450", "₽300"]
```

picks up every one of those amounts without ever having to enumerate `$€£¥₹₽₩₪₫₴₸₺…` by hand. As with `\p{L}`, the win is not just brevity. The Unicode Consortium maintains the list of currency symbols for you, and your regular expression inherits every future addition automatically. The Indian rupee `₹` (U+20B9) and the Turkish lira `₺` (U+20BA) are both relatively recent additions to the standard, and any code shipping `\p{Sc}` today already supports them and whatever comes next.

One caveat worth flagging: `\p{Sc}` covers symbols, not three-letter ISO codes like `USD` or `EUR`, because those are sequences of letters, not currency symbols. If you need to match both, compose them:

```js
/(?:\p{Sc}|USD|EUR|GBP)\s*[\d.,]+/gu;
```

The property escape handles the symbols, and the alternation handles the textual codes. That kind of composition tends to be the natural shape of real-world patterns once Unicode escapes are in your vocabulary.

There are a great many other general categories worth knowing about. `\p{P}` covers all punctuation, which is genuinely useful when you want to strip punctuation in a script-aware way. `\p{S}` covers all symbols (currency is a subset). `\p{M}` covers combining marks, which becomes important the moment you start thinking carefully about how accented characters are represented. The [MDN reference for Unicode character class escapes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape) has the full list, and it rewards a slow read.

## Emoji, and why they are harder than they look

This is the example that proves why the feature matters, and it is also the one where reality diverges most from expectation. Most developers, faced with "match an emoji" for the first time, do one of a few things: paste the specific emoji they care about directly into the pattern, search online and end up copying a frightening block of hexadecimal ranges, or reach for a library and hope for the best. The reasons this is such an uncomfortable problem are worth understanding, because they tell you a lot about how emoji actually work under the hood — and they set up exactly the gap that the `v` flag and properties of strings were designed to fill.

### Two slots for one character

Many emoji have code points above `U+FFFF`, which is the largest value that fits in a single UTF-16 code unit. Anything above that has to be represented as a surrogate pair — two code units that together encode one code point. Without the `u` flag, a regular expression treats those two code units as two separate things, and `.length` on the string lies to you in exactly the same way:

```js
"👍".length; // 2, not 1
/^.$/.test("👍"); // false — the dot matches one code unit
/^.$/u.test("👍"); // true — with /u, the dot matches one code point
```

This is the first layer of the problem, and the `u` flag solves it.

### One emoji, many code points

The second layer is harder. Even what users perceive as a single emoji is often a sequence of several code points held together with zero-width joiners (`U+200D`), variation selectors (`U+FE0F`), and skin-tone modifiers. The family emoji `👨‍👩‍👧‍👦` is seven code points. The flag of Scotland `🏴󠁧󠁢󠁳󠁣󠁴󠁿` is a black flag followed by six tag characters. A `\p{Emoji}` match on its own will happily match each component separately, which is almost never what you want. The resulting "matches" are technically correct but fall short from a practical requirements perspective.

### The `v` flag and properties of strings

This is where _properties of strings_ — documented in the [matching strings section](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape#matching_strings) of the MDN docs — come in. ES2024 introduced the `v` flag, a stricter and more capable successor to `u`, and along with it a new family of property escapes that can match whole strings rather than single code points. The crucial one for our purposes is `\p{RGI_Emoji}`, which matches a single recommended-for-general-interchange emoji as one unit, joiner sequences and all:

```js
const text = "Reactions: 👍 👨‍👩‍👧‍👦 🏴󠁧󠁢󠁳󠁣󠁴󠁿 🇿🇦 done";
[...text.matchAll(/\p{RGI_Emoji}/gv)].map((match) => match[0]);
// → ["👍", "👨‍👩‍👧‍👦", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "🇿🇦"]
```

Four matches, each one a complete user-perceived emoji. The thumbs-up, the family, the Scottish flag, and the South African flag all come back as single matches, because the regular expression engine now understands that an emoji can be a string, not just a character.

`\p{RGI_Emoji}` is only one of several properties of strings that the `v` flag makes available. There are separate ones for keycap sequences, flag sequences, modifier sequences, and so on, and the set may grow in future Unicode releases. For most code, `\p{RGI_Emoji}` covers what you want, but if you need to distinguish between, say, flag sequences and joiner sequences, the [full list is on MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape#matching_strings) and worth a look.

### A few practical notes about `v`

The `v` flag and the `u` flag are mutually exclusive on a single pattern. Trying to use both throws a `SyntaxError`. `v` adds real capability on top of `u` — the set operations described below — but it is not a strict superset: `v` imposes stricter syntax rules inside character classes, so some patterns that are valid under `u` (an unescaped `[`, `]`, or `&` inside a class, for instance) throw under `v` and need to be rewritten. Even so, there is rarely a reason to prefer `u` for new code once `v` enjoys wide enough browser support.

The `v` flag also enables set operations inside character classes, which is a significant capability in its own right. You can intersect property escapes (`[\p{Letter}&&\p{Script=Greek}]` for "letters that are also Greek"), subtract them (`[\p{Letter}--\p{ASCII}]` for "letters that are not ASCII"), and nest character classes inside other character classes. This is the syntactic upgrade that gives the flag its formal name, `unicodeSets`. The [V8 team's article on the `v` flag](https://v8.dev/features/regexp-v-flag) is a wonderful tour of the full capability if you want to go deeper.

## Why this is an accessibility and internationalisation matter

It is tempting to file all of this under "advanced regular expressions" and move on. I would argue the reverse. Most input validation, trimming, and parsing code in the wild was written with the reflex to type `A-Za-z0-9`, which means it silently misbehaves for any user whose name, address, or content lives outside ASCII. That is the majority of the planet. A surname with a diacritic, a Cyrillic given name, an Arabic address, an emoji in a display name — every one of these is a place where a careless regular expression quietly corrupts the user's data, fails a validation check that should have passed, or strips characters the user explicitly typed.

Unicode character class escapes are not a niche feature. They are the difference between code that works for everyone and code that works for a fraction of your users and fails silently for the rest. The fact that the correct version is also the shorter version is, frankly, a gift.

## Browser support and where to go next

Unicode character class escapes (the `u` flag with `\p{...}`) have been Baseline since 2020 and are safe to use everywhere you can ship modern JavaScript. The `v` flag is newer, having become Baseline in September 2023 with Firefox 116, but at this point it is well established across every evergreen browser and current Node. If your runtime targets are reasonable, both features are available to you today.

If you want to explore this further, the MDN documentation is excellent and the proposals themselves are approachable and well worth reading.

## Further reading

- [Unicode character class escape](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape) on MDN, including the [matching strings section](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape#matching_strings) for properties of strings
- [`RegExp.prototype.unicode`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicode) and [`RegExp.prototype.unicodeSets`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicodeSets) on MDN
- [The TC39 proposal for Unicode property escapes](https://github.com/tc39/proposal-regexp-unicode-property-escapes)
- [The TC39 proposal for the `v` flag](https://github.com/tc39/proposal-regexp-v-flag)
- [The V8 team's introduction to the `v` flag](https://v8.dev/features/regexp-v-flag), which is the clearest tour of set operations and properties of strings I have read
- [Unicode Technical Standard #18: Unicode Regular Expressions](https://www.unicode.org/reports/tr18/), the underlying specification that all of this implements
