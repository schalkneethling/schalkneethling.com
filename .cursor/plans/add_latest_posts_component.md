---
name: Add Latest Posts Component
overview: Create a reusable LatestPosts component that displays the 3 most recent blog posts, following the same layout and styling as the blog page's "Browse all posts" section. Add it to the homepage between the intro and The Collective section.
todos:
  - id: create-latest-posts-component
    content: Create LatestPosts.astro component in src/components/ that fetches, sorts, and displays the 3 most recent posts using the Posts component
    status: completed
  - id: update-homepage
    content: Import and add LatestPosts component to homepage between HomepageHero and TheCollective
    status: completed
    dependencies:
      - create-latest-posts-component
---

# Add Latest Posts Component to Homepage

## Overview

Create a new `LatestPosts.astro` component in `src/components/` (generic location for reusability) that displays the 3 most recent blog posts using the same layout and styling as the blog page's "Browse all posts" section.

## Implementation Steps

### 1. Create LatestPosts Component

Create `src/components/LatestPosts.astro`:

- Fetch all posts using `getCollection("posts")`
- Sort posts by publication date (newest first) using the same sorting logic as `src/pages/blog.astro`
- Take the first 3 posts using `.slice(0, 3)`
- Use the existing `Posts` component (from `src/components/Posts.astro`) to render the posts, which will automatically use the `BlogPost` component and maintain the same styling
- Wrap in a `<section>` with `aria-labelledby` attribute pointing to the heading's `id` (following the same accessibility pattern as `src/pages/blog.astro`)
- Add an appropriate heading (e.g., "Latest Posts" or "Recent Writing") with a corresponding `id` attribute
- Place in `src/components/` for reusability across the site

### 2. Update Homepage

Modify `src/pages/index.astro`:

- Import the new `LatestPosts` component from `@components/LatestPosts.astro` (or `../components/LatestPosts.astro`)
- Insert it between `HomepageHero` and `TheCollective` components
- Ensure it's within the `<main>` container for proper layout

## Files to Modify

- `src/components/LatestPosts.astro` (new file)
- `src/pages/index.astro` (add import and component)

## Design Notes

- The component will reuse `Posts` and `BlogPost` components, ensuring visual consistency with the blog page
- The section will use the same `<ul>` structure with `card card-blog-post` classes
- No additional CSS needed as existing styles will apply
- Accessibility: The `<section>` element must have `aria-labelledby` referencing the heading's `id` to provide an accessible name (following the pattern used in `src/pages/blog.astro`)
