# ForgeDesk

Premium full-stack ecommerce product built around considered workspace goods, custom bundle building, persistent customer flows, Stripe checkout, and a role-protected admin back office.

## [Repository](https://github.com/lazarbukejlovic/forgedesk)

---

## Overview

ForgeDesk is a premium commerce product designed around modern workspace and desk setup essentials. Instead of a generic catalog demo, the project was built to feel like a commercially credible brand experience with strong product presentation, clean purchasing flow, and realistic full-stack business logic.

The application combines polished storefront UX with persistent account flows, Stripe-powered checkout, order history, saved setup functionality, discount handling, and an admin area for managing products, inventory, categories, bundles, reviews, and order status transitions.

---

## Core Product Areas

### Storefront
- Premium editorial-style homepage with structured brand presentation
- Shop, bundles, and product discovery flows
- Product detail pages with variants, pricing, image handling, and related content
- Wishlist functionality
- Persistent cart
- Responsive product browsing and account-aware experience

### Build Your Setup
- Interactive setup builder for combining workspace products into a more curated buying flow
- Saved setups connected to the customer account
- Structured add-to-cart behavior from setup selections

### Authentication and Account
- Sign up / sign in / sign out flows
- Persistent customer sessions
- Account overview
- Orders page and order detail page
- Address management
- Saved setups and wishlist access

### Checkout and Orders
- Embedded Stripe checkout
- Shipping logic built into order flow
- Discount code validation and application
- Order creation and state transitions
- Paid order visibility inside the customer account
- Reorder / buy-again support

### Admin Area
- Role-protected admin access
- Products CRUD
- Category management
- Variant and pricing controls
- Product image uploads through storage
- Inventory / active / featured toggles
- Bundle management
- Discount code management
- Review moderation
- Order list, order detail, and status updates

---

## Key Features

- Premium commerce-first UI instead of template-style storefront scaffolding
- Full-stack product flow from discovery to payment to order tracking
- Persistent customer data and account-based product interactions
- Stripe checkout integrated into the product experience
- Admin-side operational tooling for realistic merchandising and order management
- Considered ecommerce UX across cart, checkout, account, and admin states

---

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- Stripe
- Edge Functions / server-side payment flow logic
- Storage-backed product image handling

---

## What This Project Demonstrates

ForgeDesk was built to show more than frontend polish. It demonstrates:

- full-stack product thinking
- ecommerce architecture and purchasing flow design
- payment integration with Stripe
- account persistence and order history
- admin tooling and operational controls
- product-focused UI / UX execution
- realistic business logic instead of shallow demo-only interactions

---

## Project Structure

The project is organized around major product areas rather than a single static storefront page. Main implementation areas include:

- storefront browsing and product presentation
- account, wishlist, saved setups, and orders
- checkout and payment flow
- admin dashboard and operational management
- storage-backed product media handling

---

## Status

ForgeDesk is a portfolio-grade shipped product focused on delivering a serious, commercially credible ecommerce experience rather than a tutorial-style store clone.

Current implementation includes:
- working storefront
- persistent customer account flow
- Stripe checkout and orders
- discount support
- reorder support
- admin management tools
- storage-backed image handling

---

## Why ForgeDesk Stands Out

Most portfolio ecommerce projects stop at product cards and a mock cart. ForgeDesk was built as a more complete product system with:

- premium branded presentation
- real checkout logic
- account persistence
- order visibility
- admin operations
- better separation between customer-facing and internal workflows

That makes it closer to a real product environment and a stronger representation of full-stack commerce work.

---

## Local Development

```bash
npm install
npm run dev
```

Typical environment setup for a local run will include project-specific values for:
- Supabase
- Stripe
- storage / auth configuration
- edge function or server-side payment logic

---

## Contact

If you want to discuss the project or the engineering decisions behind it, connect through the portfolio links on my GitHub profile or LinkedIn.
