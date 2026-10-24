# Organic Fruits & Vegetables Multi-Vendor Marketplace
# Customer App — Scope Document

**Source:** `GLM_Organic_MultiVendor_Marketplace_Prompt(1).md`  
**Document purpose:** Customer App scope only. This document extracts the requirements relevant to the customer-facing storefront and customer account journey from the original source. It does not define the scope of the Seller, Super Admin, or Delivery Partner portals.

---

## 1. Customer App Purpose

Build the customer-facing storefront for a unified multi-vendor marketplace where customers discover and purchase fresh fruits, vegetables, and related organic grocery products from multiple farmers, organic shops, and verified vendors.

The Customer App must be a polished, responsive shopping experience. Amazon and Flipkart may be used as functional and usability references only. Do not copy their logos, branding, proprietary assets, or exact page designs. Create an original brand and visual identity.

The original source requires a real full-stack application with persistent data. This scope document records the source requirements; it does not change them into a frontend-only or mock-data-only requirement.

## 2. Customer App Design and Shared Storefront Layout

### 2.1 Brand and visual direction

- Create a premium, trustworthy, fresh-food brand.
- Use a temporary working name such as **GreenBasket**, configurable so it can be changed.
- Use a bright, clean, premium white/light background.
- Use deep forest green and fresh emerald accents; use natural lime accents sparingly.
- Use high-quality, appetizing product photography.
- Use clear typography, generous whitespace, consistent spacing, rounded cards, subtle shadows, and restrained motion.
- Create a modern, professional UI inspired by leading e-commerce marketplace usability while maintaining an original design.
- Make the app fully responsive, from small mobile screens to large desktop displays.
- Ensure accessible contrast, keyboard navigation, visible focus states, semantic controls, and descriptive image alt text.
- Avoid excessive gradients, clutter, oversized empty hero areas, and distracting animations.
- Use skeleton loaders for content loading and clear empty/error states.
- Use a consistent icon library; do not use emoji as a replacement for interface icons.
- Design mobile navigation for easy one-handed shopping.

### 2.2 Shared storefront layout

- Announcement bar for seasonal offers or delivery information.
- Header containing:
  - Logo
  - Location/delivery postcode selector
  - Search
  - Account
  - Wishlist
  - Cart
- Category navigation.
- Homepage hero with a clear value proposition and shopping call to action.
- Category tiles.
- Best sellers.
- Seasonal produce.
- Recently added products.
- Verified organic picks.
- Local farmers.
- Offers.
- Repeat-order section.
- Product cards showing:
  - Product image
  - Product name
  - Seller/store
  - Pack size
  - Price
  - Offer price, where applicable
  - Stock status
  - Organic/seasonal labels, where verified
  - Ratings
  - Add to Cart action
- Footer containing help, contact, policies, seller registration, delivery information, and social links.
- Never claim that a product is certified organic unless the relevant evidence has been reviewed and approved.

## 3. Customer Roles and Access

### 3.1 Guest

Guests can:
- Browse products and stores.
- Search for products.
- View product details.
- Add products to cart where supported.

**Login is required for checkout.**

### 3.2 Customer

Customers can:
- Manage their profile.
- Manage addresses.
- Use the cart and wishlist.
- Complete checkout.
- View orders and tracking.
- Submit reviews.
- Request returns/refunds.
- Receive notifications.
- Contact support.

### 3.3 Access-control requirements affecting the Customer App

- Enforce data ownership and role-based access control.
- Customers must only be able to access their own private account, address, order, wishlist, review, and support information.
- Keep customer-facing order tracking clear without exposing internal seller data.
- Expose only the customer information needed by the relevant fulfilment workflow.
- Protect private account and checkout routes from public indexing.

## 4. Module A — Customer Storefront

### 4.1 Homepage

- Search-first shopping experience.
- Delivery location/postcode selection.
- Category browsing.
- Hero campaigns managed from Admin.
- Sections for:
  - Fresh today
  - Seasonal produce
  - Popular near you
  - Best sellers
  - Organic-certified products
  - Local farmers
  - Bundles
  - Deals
- Recently viewed items where data is available.
- Recommended items where data is available.
- Subscription/repeat-purchase promotion where enabled.
- Trust sections explaining sourcing, freshness, delivery, and return/refund policies without unsupported claims.

### 4.2 Categories

Support configurable categories and subcategories, including examples such as:
- Fresh Vegetables
- Fresh Fruits
- Leafy Greens
- Herbs
- Organic Staples
- Seasonal Produce
- Fruit Boxes and Vegetable Combos
- Other grocery categories enabled by Admin

Categories and subcategories must be configurable by Admin. The customer-facing app must display the active category structure supplied by the platform.

### 4.3 Search and filters

Customers must be able to:
- Search by product.
- Search by category.
- Search by seller/store.
- Search using supported local-language names.
- View search suggestions.
- View recent searches.

Available filters:
- Category
- Price
- Seller
- Availability
- Rating
- Seasonal
- Verified organic
- Delivery eligibility

Available sorting:
- Relevance
- Price: low to high
- Price: high to low
- Rating
- Newest
- Best-selling, where meaningful

Additional requirements:
- Pagination or reliable infinite loading.
- Helpful no-results state.
- Clear-filters action.

### 4.4 Product detail page

Display the following where the relevant information is available:

- Product image gallery with zoom and accessible controls.
- Product name.
- Full product description.
- Seller/store information.
- Seller rating.
- Unit/variant selector, for example:
  - 250 g
  - 500 g
  - 1 kg
  - 2 kg
  - Bunch
  - Box
  - Piece
- Price.
- MRP, if applicable.
- Offer price, if applicable.
- Clearly explained savings.
- Current stock and availability.
- Harvest date, when supplied and relevant.
- Packed date, when supplied and relevant.
- Best-before details, when supplied and relevant.
- Storage guidance, when supplied.
- Origin details, when verified.
- Organic certification details only after Admin verification.
- Delivery estimate based on a serviceable postcode and available delivery slots.
- Quantity selector.
- Add to Cart.
- Buy Now.
- Wishlist action.
- Share action.
- Ratings and reviews.
- Seller details.
- Related products.
- Recently viewed products.
- Report a listing option.

Do not fabricate product ratings, reviews, stock, organic certification, or delivery estimates.

### 4.5 Cart and checkout

#### Cart

- Support a persistent cart for authenticated users.
- Support a safe guest cart where supported.
- Allow a customer to buy products from multiple sellers in one checkout.
- Revalidate stock, price, delivery eligibility, coupon, and seller availability on the server before checkout.
- Recheck inventory to prevent overselling, including concurrent checkout attempts.

#### Multi-vendor order structure

When a customer buys from multiple sellers in one checkout:
- Create one customer-facing parent order.
- Create one vendor sub-order per seller.
- Maintain independent seller fulfilment status for each sub-order.
- Show a parent order summary that reflects sub-order progress.
- Allocate items, discounts, delivery fees, commissions, refunds, and settlements correctly.
- Preserve separate seller visibility and authorization boundaries.
- Handle checkout and payment events idempotently.
- Define a policy for mixed payment/COD orders and partial cancellations.
- Provide clear customer order tracking without exposing internal seller data.

#### Checkout information and totals

- Show item subtotal.
- Show discounts.
- Show delivery fee.
- Show taxes, if applicable.
- Show final total.
- Provide address selection.
- Provide address management.
- Provide delivery date/slot selection when supported.
- Provide coupon application and validation.

#### Payment methods and order confirmation

- Integrate a supported Indian payment gateway such as Razorpay after credentials and merchant configuration are provided.
- Support Cash on Delivery (COD) only when enabled by Admin and available for the delivery area.
- UPI, card, and net-banking availability must reflect the configured payment gateway.
- Prevent duplicate orders and duplicate charges.
- Create orders only through a secure server-side checkout workflow.
- Provide an order confirmation page and notification after confirmed order creation/payment state.
- Do not store raw card details.

### 4.6 Customer account

#### Registration and login

- Registration and login with secure password handling.
- Email/phone verification where configured.
- Forgot-password and reset-password flows.

#### Profile and addresses

- Customer profile and preferences.
- Multiple saved addresses.
- Default address selection.

#### Orders and order details

Customers must be able to access:
- Order list.
- Order details.
- Order status timeline.
- Invoices/receipts where supported.
- Cancellations.
- Return/refund requests according to policy.
- Reorder.

#### Wishlist and browsing history

- Wishlist.
- Recently viewed products.

#### Reviews and ratings

- Reviews and ratings only for eligible purchases.
- Review moderation.
- Review reporting.

#### Notifications and support

- Customer notifications.
- Support tickets.

#### Privacy

- Account deletion/privacy request workflow, as applicable.

## 5. Organic Produce and Freshness Requirements

The Customer App must support the following marketplace rules in its product display and shopping flows:

- Unit-based pricing for grams, kilograms, bunches, pieces, and boxes.
- Product variants such as 250 g, 500 g, 1 kg, and configurable bundles.
- Seasonal availability.
- Seller-specific stock.
- Verified organic labels.
- Organic certificate metadata with expiry/review status.
- Truthful and traceable organic claims; do not automatically label every seller's product as organic.
- Origin, harvest/packed date, and storage details only where sellers provide them and the platform workflow supports validation.
- Substitution workflows.
- Damaged/rotten produce workflows.
- Freshness complaint workflows.
- Cancellation workflows.
- Refund workflows.
- Configurable delivery areas, cut-off times, delivery slots, and capacity.
- Server-side inventory rechecks to prevent overselling, including concurrent checkout attempts.
- Partial fulfilment or unavailable-item resolution where practical.
- Explicit communication of weight/quantity substitutions and price adjustments to customers before confirmation where relevant.

## 6. Customer Notifications

Create customer-relevant notifications for:
- Account verification.
- Password reset.
- Order confirmation.
- Meaningful order-status updates.
- Payment success/failure where verified.
- Refund status.
- Delivery updates.
- Support-ticket replies.
- Promotional messages only with appropriate consent and unsubscribe controls.

Notification delivery status and errors must be stored. If a provider is not configured, documentation must clearly identify the setup requirement rather than pretending messages were sent.

## 7. Customer-Facing Policies and Content

The customer-facing experience must provide access to relevant help and policy information, including:
- Help.
- Contact details.
- Privacy policy.
- Terms.
- Cancellation/refund policy.
- Shipping/delivery policy.
- FAQs.
- Announcements.
- Delivery information.
- Seller registration information.
- Social links.

Policy pages, FAQs, contact details, and announcements are managed through the platform's content-management capabilities. The Customer App displays the published content.

Do not claim legal compliance automatically; configuration and operator review requirements must be documented.

## 8. Customer App Routes and Pages

The source specifies the following customer routes:

- `/`
- `/products`
- `/products/[slug]`
- `/categories/[slug]`
- `/stores/[slug]`
- `/search`
- `/cart`
- `/checkout`
- `/checkout/success` or an order confirmation route
- `/account`
- `/account/orders`
- `/account/orders/[id]`
- `/account/addresses`
- `/account/wishlist`
- `/account/reviews`
- `/account/support`
- `/login`
- `/register`
- `/forgot-password`

The source also lists `/seller/register` and `/seller` in the customer route grouping. These are seller-entry routes, not part of the Customer App's core customer shopping scope, but they may be linked from customer-facing seller registration/navigation where required.

Create redirects or route aliases where needed. Every navigation link must point to a real page. If a feature is intentionally deferred, label it clearly and remove misleading interactive controls.

## 9. Customer-Relevant Technical and Data Requirements

### 9.1 Technology direction from the source

First inspect the existing repository and retain its established stack when practical. If starting from scratch, the source recommends:
- Frontend: Next.js with React and TypeScript.
- Styling/UI: Tailwind CSS and accessible reusable components such as shadcn/ui.
- Backend: Next.js server actions/route handlers or a separate Node.js API, selected consistently; do not duplicate business logic across layers.
- Database: PostgreSQL with Prisma ORM for relational entities and transaction support.
- Authentication: reputable session-based/auth library with secure HTTP-only cookies, password hashing, email/phone verification options, and server-side authorization.
- Validation: Zod or equivalent shared schemas.
- Forms: React Hook Form or an equivalent maintainable approach.
- Product image storage: S3-compatible storage or Cloudinary, with server-side upload authorization and file validation.
- Payments: Razorpay integration for India, with signed webhook verification and idempotent event processing.
- Email: configured transactional email provider; do not silently claim delivery without provider confirmation.
- SMS/WhatsApp: optional integrations only after provider credentials and policy compliance are configured.
- Testing: unit tests for business rules, integration tests for critical APIs, and end-to-end tests for main shopping workflows.
- Deployment: instructions appropriate to the actual hosting platform and chosen architecture.

If the existing project uses a different compatible stack, do not migrate without a strong technical reason. Document the decision.

### 9.2 Relevant data entities

The source requires a normalized database design with appropriate relationships. Customer-app-relevant entities from the source include:

- User
- Role / Permission
- CustomerProfile
- Address
- Store / ServiceArea
- Category
- Product
- ProductImage
- ProductVariant
- Inventory / StockMovement
- Cart / CartItem
- Wishlist / WishlistItem
- Order
- VendorSubOrder
- OrderItem
- OrderStatusHistory
- Payment
- PaymentWebhookEvent
- Refund
- DeliverySlot
- Coupon / CouponRedemption
- Review
- Notification / NotificationLog
- SupportTicket / SupportMessage
- Banner / CMSPage
- PlatformSetting

Related seller, delivery, commission, and settlement records may be needed by the overall platform to support customer-visible prices, fulfilment, order status, refunds, and payment/order summaries, but their management interfaces are outside this Customer App scope.

Database requirements from the source:
- Proper primary keys and foreign keys.
- Unique constraints and indexes.
- Timestamps.
- Soft deletion where appropriate.
- Database-level constraints where possible.
- Store money as integer minor units (paise) or an exact decimal type, not floating-point arithmetic.
- Store timestamps consistently and display them in the configured timezone.
- Do not store sensitive credentials in plain text.

## 10. Security and Reliability Requirements Relevant to Customers

- Secure password hashing.
- HTTP-only, Secure, SameSite cookies where applicable.
- CSRF protections appropriate to the chosen authentication architecture.
- Server-side role and resource authorization.
- Input validation, output encoding, and safe database queries.
- Rate limiting for login, OTP, password reset, reviews, and sensitive APIs.
- Secure file-upload validation, file-size limits, allowed MIME types, and access controls where customer uploads are supported.
- Payment webhook signature verification and idempotency.
- Recalculate totals on the server to prevent price manipulation.
- Prevent unauthorized coupon use.
- Prevent stock manipulation and cross-seller data access.
- Use safe error messages that do not expose secrets or stack traces to end users.
- Use structured server logs with personal and payment data minimized.
- Maintain audit logs for sensitive administrative and financial actions.
- Provide database backup and restore guidance.
- Provide privacy policy, terms, cancellation/refund policy, shipping policy, and seller terms pages editable through Admin.
- Do not claim legal compliance automatically; document configuration and review requirements for the operator.

## 11. SEO, Accessibility, and Performance

- Server-render indexable product/category pages where supported.
- Provide unique page titles and meta descriptions.
- Provide canonical URLs.
- Provide Open Graph metadata.
- Provide sitemap and `robots.txt`.
- Provide structured product data where accurate.
- Use human-readable slugs and redirect handling when slugs change.
- Do not index private account or checkout pages.
- Optimize images.
- Lazy-load below-the-fold media.
- Paginate large lists.
- Avoid unnecessary client-side bundles.
- Add loading, error, and empty states.
- Use semantic HTML.
- Provide keyboard-accessible navigation.
- Provide accessible labels and meaningful validation messages.
- Do not fabricate product ratings, reviews, stock, organic certification, or delivery estimates.

## 12. Customer App Testing and Acceptance Criteria

The following source acceptance criteria apply directly to customer workflows:

1. Guest can browse, search, filter products, and view product details.
2. Customer can register/login and manage addresses.
3. Customer can add products from two different sellers to one cart.
4. Checkout creates one parent order and correctly separated vendor sub-orders.
5. Server revalidates price, stock, coupon, and delivery eligibility.
6. A concurrent purchase cannot oversell the same stock.
7. Payment success is recorded only after trusted server verification/webhook processing.
8. Duplicate payment webhook events do not duplicate orders, charges, or ledger entries.
9. Seller A cannot read or edit Seller B's products, orders, or earnings; customer-facing access must likewise respect data ownership and privacy.
10. Seller can add products, manage stock, and fulfil only their own orders. This is a cross-portal dependency, not a Customer App screen requirement.
11. Unapproved sellers/products are not publicly purchasable.
12. Admin can review seller documents and product listings. This is a cross-portal dependency, not a Customer App screen requirement.
13. Commission calculations and seller settlement totals reconcile. This is a platform-level dependency.
14. Refund/cancellation workflows update order and ledger states correctly.
15. Delivery partner can access only assigned deliveries. This is a cross-portal dependency.
16. Mobile navigation, search, cart, checkout, and dashboards work on small screens; for the Customer App, mobile navigation, search, cart, and checkout are in scope.
17. Invalid forms show clear errors; network failures do not lose critical order state.
18. All main routes load without 404s, broken links, or console errors.
19. No secrets are exposed in the frontend bundle or repository.
20. Build, lint, type-check, migrations, and automated tests pass—or any remaining blocker is clearly reported.

## 13. Customer App Implementation Phase from the Source

The source's customer-specific implementation phase is:

**Phase 3 — Customer storefront**
- Implement homepage.
- Implement categories.
- Implement product listing and product detail.
- Implement search, filters, and sorting.
- Implement cart.
- Implement account.
- Implement wishlist.
- Implement responsive navigation.
- Connect all pages to real persisted data.

The preceding foundation phase in the original source includes the shared design system, layout, database schema, migrations, authentication, role-based authorization, validation, and error handling. These are platform foundations that the Customer App depends on.

## 14. Customer App Deliverable from the Source

The source calls for a **responsive customer storefront** as one of the overall platform deliverables. The Customer App must implement the customer-facing pages, shopping flows, account features, and relevant acceptance criteria defined in this document.

The overall source additionally requires complete working source code, database schema and migrations, seed scripts with clearly marked sample data, `.env.example` with placeholders only, README and setup/deployment/backup/troubleshooting instructions, API/route documentation, payment and notification provider setup instructions, a test suite with actual test results, and a list of implemented features, external integrations still requiring credentials, and remaining limitations. These are overall project deliverables that support the Customer App; they are not additional customer-facing screens.

---

## Scope Boundary

This document contains the **Customer App scope only**, extracted from the original marketplace source. Seller management, Super Admin operations, and Delivery Partner workflows are not defined here as separate portal scopes. Where those portals provide data or services needed by customer journeys—such as approved products, categories, campaigns, serviceability, delivery slots, payment configuration, order fulfilment, refunds, and notifications—they are identified only as dependencies of the Customer App.
