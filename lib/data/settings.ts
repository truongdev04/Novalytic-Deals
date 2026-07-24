import { unstable_cache } from "next/cache";
import { purgeTag } from "@/lib/server/cache/purgeTag";
import { prisma, Prisma } from "@/lib/server/db";
import type {
  AffiliateSettings,
  ContentConfigSettings,
  CouponRefreshSettings,
  DealRefreshSettings,
  FooterColumn,
  FooterItem,
  FooterSettings,
  GeneralSettings,
  IntegrationsSettingsView,
  PopularStoresSettings,
  SeoSettings,
  SocialSettings,
} from "@/types";
import type { AdminIntegrationsSettingsInput } from "@/lib/validators/admin/settings";

const GENERAL_KEY = "site_meta";
const INTEGRATIONS_KEY = "integrations";
const AFFILIATE_KEY = "affiliate_defaults";
const SOCIAL_KEY = "social_links";
const SEO_KEY = "seo_defaults";
const CONTENT_CONFIG_KEY = "content_config";
const FOOTER_KEY = "footer_links";
const POPULAR_STORES_KEY = "popular_stores_config";
const DEAL_REFRESH_KEY = "deal_refresh_config";
const COUPON_REFRESH_KEY = "coupon_refresh_config";

// Keys fetched together on nearly every page render (layout/Header/Footer/Hero/
// analytics). Batching them into one query avoids each one opening its own
// Prisma connection on a cold cache — the previous 7-separate-queries setup
// was exhausting the Supabase pgbouncer connection pool under concurrent load.
const BATCHED_SETTINGS_KEYS = [
  GENERAL_KEY,
  INTEGRATIONS_KEY,
  AFFILIATE_KEY,
  SOCIAL_KEY,
  SEO_KEY,
  CONTENT_CONFIG_KEY,
  FOOTER_KEY,
] as const;

// Tagged with every individual settings tag so each setter's existing
// purgeTag(...) call also invalidates this shared cache entry without needing
// its own changes.
const getAllSiteSettingsRaw = unstable_cache(
  async (): Promise<Record<string, unknown>> => {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: [...BATCHED_SETTINGS_KEYS] } },
    });
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  },
  ["settings:all-raw"],
  {
    tags: [
      "settings:general",
      "settings:integrations",
      "settings:affiliate",
      "settings:social",
      "settings:seo",
      "settings:content-config",
      "settings:footer",
    ],
    revalidate: 300,
  }
);

const DEFAULT_POPULAR_STORES_SETTINGS: PopularStoresSettings = {
  autoPopularEnabled: false,
  lastRefreshedAt: null,
  lastRolloverPeriod: null,
};

const DEFAULT_DEAL_REFRESH_SETTINGS: DealRefreshSettings = {
  autoDealEnabled: false,
  lastRefreshedAt: null,
  lastRolloverAt: null,
};

const DEFAULT_COUPON_REFRESH_SETTINGS: CouponRefreshSettings = {
  autoCouponEnabled: false,
  lastRefreshedAt: null,
  lastRolloverAt: null,
};

const DEFAULT_CONTENT_CONFIG_SETTINGS: ContentConfigSettings = {
  pagination: {
    dealsPageSize: 9,
    featuredStoresCount: 8,
    featuredCategoriesCount: 8,
    trendingDealsCount: 3,
    exclusiveCodesCount: 3,
    bestDealsCount: 6,
    featuredBlogCount: 3,
  },
  templates: {
    storeFaqTemplateSets: [
      {
        setId: "faq-set-1",
        items: [
          {
            question: "What should I do if a {name} promo code shows as invalid?",
            answer:
              "Most \"invalid code\" errors come down to timing or eligibility. {name} sets a start and end date for each promotion, and the code stops working the moment that window closes, even if it worked earlier the same day. It can also be limited to specific products or require a minimum order value your cart doesn't currently meet. Double-check the terms listed with the code on this page, and if it's genuinely expired, look for a current replacement offer instead.",
          },
          {
            question: "What's the easiest way to use a {name} coupon code?",
            answer:
              "Start by copying the code exactly as shown on this page, then head to {name}'s website and add the items you want to your cart. During checkout, look for the promo or discount code field, usually near the order summary, paste the code in, and apply it before entering payment details. Your order total should update immediately to reflect the savings.",
          },
          {
            question: "Does every {name} deal on this page require a code?",
            answer:
              "No — some discounts are automatic and apply directly at checkout once you add a qualifying item, without needing you to type anything in. We still list these offers alongside coupon codes so you have a full picture of every way to save at {name}. If a deal doesn't show a code on this page, it's likely one of these automatic promotions.",
          },
          {
            question: "What do I need to qualify for free shipping at {name}?",
            answer:
              "Free shipping offers usually depend on your order reaching a minimum subtotal, which is listed in the terms next to the offer on this page. Some promotions also limit free shipping to specific shipping speeds or regions, so it's worth checking the details if your order is close to qualifying. Once your cart meets the threshold, the discount is typically applied automatically before you reach payment.",
          },
          {
            question: "How often does {name} release new coupon codes?",
            answer:
              "There's no fixed schedule, but {name} tends to introduce new codes periodically throughout the month, with activity increasing noticeably around major shopping events and seasonal sales. On quieter weeks, you might see fewer new offers, while promotional periods can bring several updates in a short span. Checking back regularly, especially ahead of a planned purchase, gives you the best chance of catching a fresh code.",
          },
        ],
      },
      {
        setId: "faq-set-2",
        items: [
          {
            question: "Can you walk me through redeeming a {name} discount code step by step?",
            answer:
              "First, browse the codes on this page and pick the one that best matches what you're buying. Next, copy the code and open {name}'s site in a new tab, adding your chosen items to the cart as usual. Finally, during checkout, paste the code into the discount field, click apply, and confirm the reduced total before completing payment.",
          },
          {
            question: "How can I tell if a {name} discount needs a code or applies on its own?",
            answer:
              "Offers on this page that show a code to copy require you to enter it manually at checkout, while automatic deals are simply labeled as such and reflect the discount directly in the product price or cart total. If you're ever unsure, adding the item to your cart will usually reveal whether a discount has already been applied before you reach the payment step. Automatic promotions tend to be tied to specific products or a storewide sale event.",
          },
          {
            question: "Does {name} offer free delivery on every order?",
            answer:
              "Free delivery isn't always available across every order — it's usually tied to a specific promotion, a minimum spend, or select products, rather than being a permanent policy. When a free delivery offer is currently active, we list it on this page along with its exact conditions. Outside of an active promotion, standard shipping rates from {name} would typically apply.",
          },
          {
            question: "Are {name} coupons available every single day?",
            answer:
              "Not necessarily — while {name} runs promotions fairly often, there isn't always an active code available on any given day. If nothing is currently listed, it's worth checking back within a few days, since new offers tend to appear regularly rather than all at once. Signing up for updates, if available, is another way to catch a new code as soon as it goes live.",
          },
          {
            question: "What kinds of discount codes does {name} typically offer?",
            answer:
              "{name}'s codes generally fall into a few common categories: percentage-off codes, fixed-amount-off codes, free shipping offers, and occasionally a free-gift-with-purchase or bundle deal. The type of discount available at any given time depends on what {name} is currently promoting, so it's worth checking the terms of each listed code to see which category it falls into. Comparing a few options against your cart total usually reveals which one saves you the most.",
          },
        ],
      },
      {
        setId: "faq-set-3",
        items: [
          {
            question: "Do I need to do anything special to activate a {name} deal?",
            answer:
              "Most deals just require you to shop as usual and either enter a code at checkout or let an automatic discount apply itself — there's no separate activation step involved. If a specific offer does require something extra, like signing up with an email or joining a program, that requirement will be spelled out in the terms listed with the offer on this page. Otherwise, simply following the standard checkout process is enough.",
          },
          {
            question: "Will a {name} discount code lower my shipping cost too?",
            answer:
              "Most product discount codes apply only to the price of your items and don't automatically reduce shipping charges, unless the offer specifically mentions free or discounted shipping. If saving on shipping is your priority, look for a dedicated free-shipping offer on this page rather than assuming a percentage-off code covers it. Your order summary at checkout will clearly show whether shipping was affected.",
          },
          {
            question: "When is the best time to check this page for a new {name} deal?",
            answer:
              "Right before you're ready to make a purchase is generally the smartest time, since that's when having the most current code matters most. Beyond that, checking around major shopping seasons tends to be worthwhile, as retailers like {name} typically increase both the number and size of their promotions during those windows. Outside of peak periods, checking every week or two is usually enough to stay current.",
          },
          {
            question: "Does {name} offer gift cards, and can they be combined with a coupon code?",
            answer:
              "When a {name} gift card promotion is available, we list it on this page alongside standard coupon codes. Whether a gift card purchase or redemption can be combined with a separate discount code depends on {name}'s own checkout rules, so it's worth testing during checkout or checking the offer's terms. Gift cards are typically treated as a form of payment rather than a discount, so they usually don't conflict with a code applied to the order itself.",
          },
          {
            question: "How do I know if my {name} coupon code actually worked?",
            answer:
              "Once you apply a valid code, your order summary should update right away to show both the discount amount and your new total, before you're asked for payment details. If the total doesn't change after applying the code, that's usually a sign it wasn't accepted rather than a display delay. Double-checking the code and your cart contents is the quickest way to figure out what went wrong if this happens.",
          },
        ],
      },
      {
        setId: "faq-set-4",
        items: [
          {
            question: "Can I combine a {name} shipping discount with a product coupon code?",
            answer:
              "In many cases yes, since a shipping-specific offer and a product discount code are usually applied at different points in checkout and don't conflict with each other. Some promotions are written to exclude combination with other offers, so it's worth checking the terms of each one before assuming they'll stack. Applying both and checking your final total is the most reliable way to confirm.",
          },
          {
            question: "Does {name} tend to release bigger discounts at certain times of year?",
            answer:
              "Yes, most retailers save their strongest promotions for major shopping periods and holiday sales, when competition for customer attention is highest. Outside those windows, {name}'s regular codes are typically more modest but still worth using. If you can be flexible with timing, planning a purchase around a known sale period often means better overall value.",
          },
          {
            question: "What's the difference between a percentage-off and an amount-off code at {name}?",
            answer:
              "A percentage-off code reduces your total by a set percentage, which tends to be more valuable on larger orders since the savings scale with your cart total. An amount-off code instead subtracts a fixed dollar or euro amount regardless of order size, which can be more valuable on smaller purchases. Comparing both against your actual cart total is the easiest way to see which type saves you more before checkout.",
          },
          {
            question: "Why don't I see a discount code field at {name}'s checkout?",
            answer:
              "This usually comes down to one of two things — either the payment method you've selected doesn't support promo codes, or the field is present but tucked behind a small expandable link rather than shown by default. Scrolling through the entire checkout page or trying a different payment method can sometimes reveal it. If the field genuinely isn't there, {name} may not be running any active code-based promotions at that moment, relying on automatic discounts instead.",
          },
          {
            question: "Does {name} reward repeat customers with better offers over time?",
            answer:
              "Some retailers run a loyalty or rewards program that gives regular customers access to points, exclusive codes, or early access to sales — if {name} offers something like this, details are typically found in their account section. This is separate from the general coupon codes listed on this page, which are usually open to any shopper. If you order from {name} often, it's worth checking whether they have a loyalty program you're not yet taking advantage of.",
          },
        ],
      },
      {
        setId: "faq-set-5",
        items: [
          {
            question: "How can I avoid missing a new {name} coupon code?",
            answer:
              "The most reliable approach is simply checking this page periodically, since we add new {name} codes as soon as they become available. If a newsletter or alert signup is offered on our site, subscribing is another way to stay informed without manually checking. Bookmarking this specific store page also makes it quick to return to whenever you're ready to shop.",
          },
          {
            question: "Can I share or gift a {name} exclusive coupon code with someone else?",
            answer:
              "This depends on how the specific offer is structured — if {name} requires an email address or account login to activate an exclusive code, it's generally tied to that individual and can't be transferred. If the code has no such requirement and simply needs to be entered at checkout, it may work for anyone who has it, though usage may still be limited to a certain number of redemptions. Checking the code's terms on this page will clarify any restrictions before you try to share it.",
          },
          {
            question: "Is there a way to see how much I actually saved on a {name} order?",
            answer:
              "Yes, your order confirmation and receipt from {name} should itemize the discount separately from the item prices, showing exactly how much the applied code or automatic promotion saved you. This is also visible in your order summary at checkout, before you complete payment. Keeping that confirmation is useful if you ever need to reference your savings for a return or customer service inquiry.",
          },
          {
            question: "Is there a {name} discount reserved just for new customers?",
            answer:
              "When a first-time or new-customer offer is currently available, it's listed on this page with terms specifically mentioning that restriction. These tend to be some of the stronger discounts {name} offers, since retailers use them to encourage a first purchase. Eligibility is usually checked against your account or email at checkout, so the code may not apply if you've ordered from {name} before.",
          },
          {
            question: "How do you make sure the {name} codes on this page actually work?",
            answer:
              "Every code is manually checked by our team before it's published, confirming it genuinely applies a discount at {name}'s checkout. After publishing, we continue monitoring active codes and remove or flag ones that stop working, since promotions can end without notice. This ongoing process is why you'll often see a verified badge next to codes we've recently confirmed.",
          },
        ],
      },
      {
        setId: "faq-set-6",
        items: [
          {
            question: "Is there a sitewide coupon available for {name} right now?",
            answer:
              "When {name} runs a sitewide promotion that applies across their entire catalog rather than select items, we highlight it clearly on this page. Sitewide codes tend to be some of the most useful since they aren't limited to specific products, but they're not always active — availability depends on {name}'s current promotional calendar. If one isn't listed right now, checking back periodically is the best way to catch one when it launches.",
          },
          {
            question: "My {name} order total looks the same after I applied a code — what happened?",
            answer:
              "This almost always means the code wasn't successfully applied, even if no visible error appeared. Common causes include an expired code, a cart that doesn't meet the minimum order value, or excluded items sitting in your cart. Removing and re-entering the code carefully, then confirming the total updates before you proceed, is the best way to catch this before completing your purchase.",
          },
          {
            question: "Do I need a {name} account to take advantage of these coupon codes?",
            answer:
              "No account with our site is required to browse or copy any code listed here. Whether {name} itself requires you to create an account to complete checkout is a separate matter, determined by their own site rather than by the coupon. Some codes are reserved specifically for registered accounts or subscribers, and that restriction would be noted in the code's terms if it applies.",
          },
          {
            question: "What should I do if I find a {name} coupon code that isn't working?",
            answer:
              "Letting us know is the most helpful thing you can do — reporting a broken code allows our team to re-check it and update the listing quickly for other shoppers. Before reporting, it's worth confirming the code hasn't simply expired or that your cart meets its minimum requirements, since those are the most common causes of failure. Either way, reporting an issue helps keep this page accurate.",
          },
          {
            question: "What's currently the best {name} coupon available?",
            answer:
              "The strongest current offer is generally the one showing the highest percentage or dollar discount among active, verified codes on this page, though the \"best\" option can depend on your specific order size and contents. We aim to surface the top offers near the top of the list, so it's worth comparing a couple of options against your actual cart before deciding. Since offers rotate, the best available code can change from week to week.",
          },
        ],
      },
      {
        setId: "faq-set-7",
        items: [
          {
            question: "How can I double-check my {name} discount before finalizing payment?",
            answer:
              "Before entering payment information, review your order summary, which should clearly separate your subtotal, the applied discount, and your final total. This is your last chance to confirm everything looks right, including that the correct code was used and any free shipping condition was met. If something looks off at this stage, it's much easier to fix before payment than after the order is placed.",
          },
          {
            question: "Does signing up for {name}'s emails unlock any extra savings?",
            answer:
              "Many retailers send subscriber-exclusive codes by email as an incentive to sign up, and if a publicly shareable version of such an offer exists, we include it here too. Some of the best subscriber deals, however, are only ever sent directly and won't appear on a public page like this one. If you shop at {name} regularly, subscribing directly is worth considering alongside checking back here.",
          },
          {
            question: "Can I submit a {name} coupon code that I found somewhere else?",
            answer:
              "Yes, we welcome submissions from shoppers who come across a working {name} code that isn't already listed here. Our team reviews and tests submitted codes before adding them, to confirm they're genuine and currently active. Crowdsourced submissions like this often help us catch new or region-specific promotions faster than we'd find them otherwise.",
          },
          {
            question: "How long do {name}'s current deals typically stay active?",
            answer:
              "This varies by offer — {name} announces how long each promotional period will run, and the codes or deals tied to it remain valid within that window. Some promotions last just a few days around a sale event, while others run for weeks. Checking the expiration date listed with each offer on this page is the most reliable way to know exactly how much time you have.",
          },
          {
            question: "Why does a {name} coupon code keep getting rejected at checkout?",
            answer:
              "A rejected code almost always means one of its conditions isn't being met — commonly an order total below the required minimum, an excluded product category, or a code reserved for first-time customers only. It's also worth checking for accidental extra spaces if you typed or pasted the code manually. If the terms match your order and it's still rejected, the promotion may have ended more recently than our last check, so let us know and we'll verify it.",
          },
        ],
      },
      {
        setId: "faq-set-8",
        items: [
          {
            question: "Are there special discounts for students, military members, or other groups at {name}?",
            answer:
              "If {name} runs a verified discount program for students, military members, healthcare workers, or a similar group, we list the details and any associated code here when publicly available. These programs typically require identity verification through a third-party service rather than a simple code. If you believe you qualify but don't see an offer listed, checking {name}'s own website directly is the most reliable way to confirm.",
          },
          {
            question: "Why should I check this page instead of just searching for a {name} code myself?",
            answer:
              "Searching on your own often turns up expired, fake, or region-restricted codes mixed in with working ones, with no easy way to tell which is which. We save you that guesswork by testing codes before publishing them and monitoring them afterward, alongside listing automatic deals you might not find through a search at all. It's a faster, more reliable way to see every current way to save at {name} in one place.",
          },
          {
            question: "Are {name}'s best deals only available for a short window?",
            answer:
              "Some of the most significant discounts are tied to limited-time sales or flash promotions that can end within hours or a single day, while others run for weeks as part of a longer promotional period. We mark time-sensitive offers clearly on this page so you know which ones require quicker action. If you see a strong deal with a near-term expiration, it's worth acting on sooner rather than waiting.",
          },
          {
            question: "My {name} discount code worked yesterday but not today — why?",
            answer:
              "{name} runs its promotions on fixed windows, so a code that worked yesterday can simply expire overnight without any warning. Some retailers also cap how many total redemptions a code can have, meaning it can run out before its listed expiration date if it's popular. If a code you were counting on has stopped working, check this page for a newer offer, since we replace expired codes as soon as we spot them.",
          },
          {
            question: "Where exactly should I paste a {name} coupon code during checkout?",
            answer:
              "Look for a field labeled something like \"Promo Code,\" \"Coupon Code,\" or \"Discount Code,\" typically positioned near your order summary or just before the payment step. On some sites this field is hidden behind a small link such as \"Have a code?\" rather than shown by default. Paste the code exactly as listed here, apply it, and check that your total updates before moving on to payment.",
          },
        ],
      },
      {
        setId: "faq-set-9",
        items: [
          {
            question: "Do you guarantee that every {name} code listed here is currently active?",
            answer:
              "We test each code before publishing and monitor it afterward, but we can't guarantee indefinite accuracy, since retailers like {name} can end a promotion at any time without notifying us directly. This is a normal limitation shared by every coupon site, not something specific to how we operate. If a code fails despite looking current, reporting it helps us catch and correct it quickly.",
          },
          {
            question: "How do I know if a {name} deal is worth waiting for versus using now?",
            answer:
              "If you're not in a rush, it can be worth checking whether {name} typically runs a bigger sale around an upcoming shopping event, since that could beat the current offer. However, if a current code already meets your needs and there's no guarantee a better one is coming, using it now avoids the risk of it expiring before a hypothetical bigger sale arrives. Weighing the size of the current discount against how flexible your timing is will usually point to the right choice.",
          },
          {
            question: "Can I still use a {name} code if it's close to its expiration date?",
            answer:
              "Yes, as long as you complete your checkout before the expiration moment, a code remains valid right up until it lapses. Keep in mind the discount is only locked in when you finish the order, not when you first add the code to your cart, so don't leave a near-expiring code sitting unused for too long. If you're not sure exactly when a code expires, this page lists the date whenever {name} provides one.",
          },
          {
            question: "What should I have ready before I try to redeem a {name} code?",
            answer:
              "It helps to have your cart already filled with the items you plan to buy, since some codes only apply once your order meets a minimum value or includes specific products. Keep the code copied or easily accessible so you can paste it without retyping, which avoids formatting errors. Having both ready before you reach checkout makes the whole process quicker and reduces the chance of a failed redemption.",
          },
          {
            question: "Can I use more than one {name} coupon code on the same order?",
            answer:
              "Most retailers, {name} included, only allow one discount code to be applied per order, and their checkout system will typically reject or ignore a second code once one is already active. Occasionally a second field appears for a separate promotion type, such as a gift card or loyalty credit, which can sometimes be combined with a coupon code — but two overlapping percentage-off codes almost never stack. If you have multiple codes, it's usually worth comparing their value beforehand and using whichever gives you the better overall discount.",
          },
        ],
      },
      {
        setId: "faq-set-10",
        items: [
          {
            question: "When should I use a {name} coupon code to get the biggest savings?",
            answer:
              "Timing matters most around major shopping periods, when {name} tends to release its strongest and most frequent promotions. Outside of those windows, codes are usually more modest but still worth using rather than paying full price. If you can be flexible about when you buy, watching for a seasonal sale often yields better overall savings than shopping at a random time.",
          },
          {
            question: "What's the most common reason a {name} coupon code doesn't work?",
            answer:
              "In our experience, the single most common cause is a cart that doesn't meet the code's minimum spend or product requirements, closely followed by the code simply having expired. Formatting mistakes — an extra space, a missing character when copying — are the next most frequent issue. Working through those three checks resolves the vast majority of failed redemptions before you need to contact anyone.",
          },
          {
            question: "Can you give me a guide for using {name} coupon codes?",
            answer:
              "Browse the codes on this page and pick the one that best fits your order, then copy it and open {name}'s website in a new tab. Add the items you want to your cart, then look for the discount code field during checkout and paste the code in. Apply it, confirm your total drops as expected, and complete your purchase.",
          },
          {
            question: "Do returning customers get access to the same {name} discount codes as new customers?",
            answer:
              "In most cases, yes — the majority of codes listed on this page are open to any shopper, regardless of whether you've ordered from {name} before, unless the terms explicitly restrict the offer to new customers only. New-customer-only codes are usually clearly labeled as such, so if you don't see that restriction, the code should work for a returning customer as well. If a code is rejected and you're unsure why, checking the eligibility requirements listed with that specific offer is the best first step.",
          },
          {
            question: "Does {name} ship internationally, and do the discount codes still work abroad?",
            answer:
              "Whether {name} ships to your country is determined by their own shipping policy, separate from any coupon code. If they do ship internationally, a valid discount code should generally apply the same way it would domestically, unless the offer specifically restricts it to certain regions. International orders may still involve different shipping costs or customs fees that aren't affected by the code itself.",
          },
        ],
      },
    ],
  },
};

const ABOUT_PAGE_DESCRIPTION = `<p>NovalyticDeals is a coupon and deals platform built to help shoppers across the US and Europe save money with confidence. We test every code before it goes live, track expiration dates closely, and highlight the offers that give you the most value.</p>
<p>Our team partners with thousands of retailers to bring you exclusive discounts, cashback offers, and seasonal sales — all in one place, updated daily.</p>
<h2>Verified first</h2>
<p>Every coupon on our site is checked by hand before it's published.</p>
<h2>Curated deals</h2>
<p>We focus on quality over quantity, surfacing the offers actually worth your time.</p>
<h2>Built for shoppers</h2>
<p>Our tools are designed around real shopping habits across the US and Europe.</p>`;

const TERMS_PAGE_DESCRIPTION = `<h2>Acceptance of terms</h2>
<p>By accessing or using NovalyticDeals, you agree to be bound by these Terms of Service. If you do not agree, please do not use the site.</p>
<h2>Use of coupons and deals</h2>
<p>Coupons and deals listed on this site are provided by third-party retailers. While we verify codes regularly, we cannot guarantee that every code will work at the time you attempt to use it. Discount terms, exclusions, and expiration dates are set by the retailer, not NovalyticDeals.</p>
<h2>Affiliate links</h2>
<p>Some links on this site are affiliate links. We may receive a commission when you make a purchase through these links, at no extra cost to you. This does not influence which deals we choose to feature.</p>
<h2>User submissions</h2>
<p>By submitting a coupon or review, you grant NovalyticDeals a non-exclusive license to publish and display the content. We reserve the right to reject or remove any submission that is inaccurate, spam, or violates these terms.</p>
<h2>Limitation of liability</h2>
<p>NovalyticDeals is not responsible for any loss or damage resulting from the use of coupons, deals, or third-party websites linked from this site.</p>
<h2>Changes to these terms</h2>
<p>We may update these terms from time to time. Continued use of the site after changes are posted constitutes acceptance of the revised terms.</p>`;

const PRIVACY_PAGE_DESCRIPTION = `<h2>Information we collect</h2>
<p>We collect information you provide directly, such as your email address when subscribing to our newsletter or submitting a coupon, along with usage data like pages visited and coupons clicked, collected automatically through cookies and analytics tools.</p>
<h2>How we use your information</h2>
<p>We use collected information to operate and improve the site, send newsletter updates you've opted into, moderate user-submitted coupons, and measure the performance of deals and stores.</p>
<h2>Cookies</h2>
<p>We use cookies for essential site functionality, analytics, and to remember your preferences. You can control cookies through your browser settings at any time.</p>
<h2>Affiliate disclosure</h2>
<p>NovalyticDeals participates in affiliate marketing programs. We may earn a commission when you click through to a retailer and make a purchase, at no additional cost to you.</p>
<h2>Data sharing</h2>
<p>We do not sell your personal information. We may share limited data with service providers who help us operate the site, such as email delivery and analytics providers, under strict confidentiality agreements.</p>
<h2>Your rights</h2>
<p>You may request access to, correction of, or deletion of your personal data at any time by contacting us. EU residents have additional rights under GDPR, and California residents have rights under the CCPA.</p>`;

const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  columns: [
    {
      title: "Quick links",
      type: "PATH",
      isVisible: true,
      items: [
        { itemId: "seed-stores", name: "Stores", path: "/stores", isVisible: true },
        { itemId: "seed-categories", name: "Categories", path: "/categories", isVisible: true },
        { itemId: "seed-deals", name: "Deals", path: "/deals", isVisible: true },
      ],
    },
    {
      title: "Company",
      type: "PATH",
      isVisible: true,
      items: [
        { itemId: "seed-contact", name: "Contact Us", path: "/contact", isVisible: true },
        { itemId: "seed-submit", name: "Submit a Coupon", path: "/submit", isVisible: true },
        { itemId: "seed-blog", name: "Blog", path: "/blog", isVisible: true },
      ],
    },
    {
      title: "Legal",
      type: "PAGE",
      isVisible: true,
      items: [
        {
          itemId: "seed-about",
          name: "About Us",
          title: "About NovalyticDeals",
          slug: "about",
          description: ABOUT_PAGE_DESCRIPTION,
          isVisible: true,
        },
        {
          itemId: "seed-terms",
          name: "Terms Of Use",
          title: "Terms of Service",
          slug: "terms",
          description: TERMS_PAGE_DESCRIPTION,
          isVisible: true,
        },
        {
          itemId: "seed-privacy",
          name: "Privacy Policy",
          title: "Privacy Policy",
          slug: "privacy",
          description: PRIVACY_PAGE_DESCRIPTION,
          isVisible: true,
        },
      ],
    },
  ],
};

const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  title: "NovalyticDeals",
  description: "Verified coupons and deals for the US & Europe.",
  logoUrl: "",
  faviconUrl: "",
  ogImage: "",
  robotsIndexingEnabled: true,
  sitemapEnabled: true,
  slogan: "",
  topDescription: "",
  bottomDescription: "",
  companyName: "",
  hotline: "",
  address: "",
  email: "",
  copyright: "",
  contactIntro:
    "Have a question about a coupon, a store, or a partnership? Send us a message and our team will get back to you shortly.",
};

// Raw persistence shape for integrations — never sent to the client as-is.
interface IntegrationsRaw {
  resendApiKey?: string;
  contactInboxEmail?: string;
  turnstileSecretKey?: string;
  gaId?: string;
  gtmId?: string;
  plausibleDomain?: string;
  googleSiteVerification?: string;
  bingSiteVerification?: string;
}

async function getIntegrationsRaw(): Promise<IntegrationsRaw> {
  const all = await getAllSiteSettingsRaw();
  return (all[INTEGRATIONS_KEY] as unknown as IntegrationsRaw) ?? {};
}

export async function getGeneralSettings(): Promise<GeneralSettings> {
  const all = await getAllSiteSettingsRaw();
  const stored = (all[GENERAL_KEY] as unknown as Partial<GeneralSettings>) ?? {};
  return { ...DEFAULT_GENERAL_SETTINGS, ...stored };
}

export async function setGeneralSettings(input: GeneralSettings): Promise<GeneralSettings> {
  const row = await prisma.siteSetting.upsert({
    where: { key: GENERAL_KEY },
    create: { key: GENERAL_KEY, value: input as unknown as Prisma.InputJsonValue },
    update: { value: input as unknown as Prisma.InputJsonValue },
  });
  purgeTag("settings:general");
  return row.value as unknown as GeneralSettings;
}

function maskSecret(value?: string): string | undefined {
  if (!value) return undefined;
  return `••••${value.slice(-4)}`;
}

export async function getIntegrationsSettingsView(): Promise<IntegrationsSettingsView> {
  const raw = await getIntegrationsRaw();

  const resendConfigured = Boolean(raw.resendApiKey || process.env.RESEND_API_KEY);
  const turnstileConfigured = Boolean(raw.turnstileSecretKey || process.env.TURNSTILE_SECRET_KEY);

  return {
    resendApiKey: {
      configured: resendConfigured,
      source: raw.resendApiKey ? "db" : process.env.RESEND_API_KEY ? "env" : "none",
      maskedPreview: maskSecret(raw.resendApiKey),
    },
    contactInboxEmail: raw.contactInboxEmail ?? "",
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
    turnstileSiteKeySource: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? "env" : "none",
    turnstileSecretKey: {
      configured: turnstileConfigured,
      source: raw.turnstileSecretKey ? "db" : process.env.TURNSTILE_SECRET_KEY ? "env" : "none",
      maskedPreview: maskSecret(raw.turnstileSecretKey),
    },
    gaId: raw.gaId ?? "",
    gtmId: raw.gtmId ?? "",
    plausibleDomain: raw.plausibleDomain ?? "",
    googleSiteVerification: raw.googleSiteVerification ?? "",
    bingSiteVerification: raw.bingSiteVerification ?? "",
  };
}

export async function setIntegrationsSettings(
  patch: AdminIntegrationsSettingsInput
): Promise<IntegrationsSettingsView> {
  const current = await getIntegrationsRaw();
  const next: IntegrationsRaw = { ...current };

  // Non-secret fields: "" clears (falls back to env), value sets it.
  if (patch.contactInboxEmail !== undefined) {
    next.contactInboxEmail = patch.contactInboxEmail || undefined;
  }
  if (patch.gaId !== undefined) {
    next.gaId = patch.gaId || undefined;
  }
  if (patch.gtmId !== undefined) {
    next.gtmId = patch.gtmId || undefined;
  }
  if (patch.plausibleDomain !== undefined) {
    next.plausibleDomain = patch.plausibleDomain || undefined;
  }
  if (patch.googleSiteVerification !== undefined) {
    next.googleSiteVerification = patch.googleSiteVerification || undefined;
  }
  if (patch.bingSiteVerification !== undefined) {
    next.bingSiteVerification = patch.bingSiteVerification || undefined;
  }

  // Secret fields: blank/omitted = leave unchanged. Only clearFields nulls one out.
  if (patch.resendApiKey) {
    next.resendApiKey = patch.resendApiKey;
  }
  if (patch.turnstileSecretKey) {
    next.turnstileSecretKey = patch.turnstileSecretKey;
  }
  for (const field of patch.clearFields ?? []) {
    delete next[field];
  }

  await prisma.siteSetting.upsert({
    where: { key: INTEGRATIONS_KEY },
    create: { key: INTEGRATIONS_KEY, value: next as unknown as Prisma.InputJsonValue },
    update: { value: next as unknown as Prisma.InputJsonValue },
  });
  purgeTag("settings:integrations");

  return getIntegrationsSettingsView();
}

export async function getEffectiveResendConfig(): Promise<{ apiKey?: string; fromEmail?: string }> {
  const raw = await getIntegrationsRaw();
  return {
    apiKey: raw.resendApiKey || process.env.RESEND_API_KEY,
    fromEmail: raw.contactInboxEmail || process.env.CONTACT_INBOX_EMAIL,
  };
}

export async function getEffectiveTurnstileConfig(): Promise<{ secretKey?: string }> {
  const raw = await getIntegrationsRaw();
  return { secretKey: raw.turnstileSecretKey || process.env.TURNSTILE_SECRET_KEY };
}

export async function getEffectiveAnalyticsConfig(): Promise<{
  gaId?: string;
  gtmId?: string;
  plausibleDomain?: string;
}> {
  const raw = await getIntegrationsRaw();
  return {
    gaId: raw.gaId || process.env.NEXT_PUBLIC_GA_ID,
    gtmId: raw.gtmId,
    plausibleDomain: raw.plausibleDomain || process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
  };
}

export async function getEffectiveGoogleSiteVerification(): Promise<string | undefined> {
  const raw = await getIntegrationsRaw();
  return raw.googleSiteVerification || undefined;
}

export async function getEffectiveBingSiteVerification(): Promise<string | undefined> {
  const raw = await getIntegrationsRaw();
  return raw.bingSiteVerification || undefined;
}

export async function getAffiliateSettings(): Promise<AffiliateSettings> {
  const all = await getAllSiteSettingsRaw();
  return (all[AFFILIATE_KEY] as unknown as AffiliateSettings) ?? {};
}

export async function setAffiliateSettings(input: AffiliateSettings): Promise<AffiliateSettings> {
  const row = await prisma.siteSetting.upsert({
    where: { key: AFFILIATE_KEY },
    create: { key: AFFILIATE_KEY, value: input as unknown as Prisma.InputJsonValue },
    update: { value: input as unknown as Prisma.InputJsonValue },
  });
  purgeTag("settings:affiliate");
  return row.value as unknown as AffiliateSettings;
}

export async function getEffectiveDefaultAffiliateNetwork(): Promise<string | undefined> {
  const settings = await getAffiliateSettings();
  return settings.defaultAffiliateNetwork || process.env.AFFILIATE_DEFAULT_NETWORK;
}

export const getPopularStoresSettings = unstable_cache(
  async (): Promise<PopularStoresSettings> => {
    const row = await prisma.siteSetting.findUnique({ where: { key: POPULAR_STORES_KEY } });
    const stored = (row?.value as unknown as Partial<PopularStoresSettings>) ?? {};
    return { ...DEFAULT_POPULAR_STORES_SETTINGS, ...stored };
  },
  ["settings:popular-stores"],
  { tags: ["settings:popular-stores"], revalidate: 60 }
);

// No purgeTag here: one caller (ensurePopularStoresAutoRollover) runs inside
// the home page's own render, where revalidateTag is disallowed. Callers
// outside a render (route handlers) purge "settings:popular-stores"
// themselves; the render-path caller relies on this setting's own 60s
// revalidate window.
export async function setPopularStoresSettings(
  patch: Partial<PopularStoresSettings>
): Promise<PopularStoresSettings> {
  const current = await getPopularStoresSettings();
  const next: PopularStoresSettings = { ...current, ...patch };
  await prisma.siteSetting.upsert({
    where: { key: POPULAR_STORES_KEY },
    create: { key: POPULAR_STORES_KEY, value: next as unknown as Prisma.InputJsonValue },
    update: { value: next as unknown as Prisma.InputJsonValue },
  });
  return next;
}

export const getDealRefreshSettings = unstable_cache(
  async (): Promise<DealRefreshSettings> => {
    const row = await prisma.siteSetting.findUnique({ where: { key: DEAL_REFRESH_KEY } });
    const stored = (row?.value as unknown as Partial<DealRefreshSettings>) ?? {};
    return { ...DEFAULT_DEAL_REFRESH_SETTINGS, ...stored };
  },
  ["settings:deal-refresh"],
  { tags: ["settings:deal-refresh"], revalidate: 60 }
);

// No purgeTag here: one caller (ensureAutoDealRollover) runs inside the home
// page's own render, where revalidateTag is disallowed. Callers outside a
// render (route handlers) purge "settings:deal-refresh" themselves; the
// render-path caller relies on this setting's own 60s revalidate window.
export async function setDealRefreshSettings(
  patch: Partial<DealRefreshSettings>
): Promise<DealRefreshSettings> {
  const current = await getDealRefreshSettings();
  const next: DealRefreshSettings = { ...current, ...patch };
  await prisma.siteSetting.upsert({
    where: { key: DEAL_REFRESH_KEY },
    create: { key: DEAL_REFRESH_KEY, value: next as unknown as Prisma.InputJsonValue },
    update: { value: next as unknown as Prisma.InputJsonValue },
  });
  return next;
}

export const getCouponRefreshSettings = unstable_cache(
  async (): Promise<CouponRefreshSettings> => {
    const row = await prisma.siteSetting.findUnique({ where: { key: COUPON_REFRESH_KEY } });
    const stored = (row?.value as unknown as Partial<CouponRefreshSettings>) ?? {};
    return { ...DEFAULT_COUPON_REFRESH_SETTINGS, ...stored };
  },
  ["settings:coupon-refresh"],
  { tags: ["settings:coupon-refresh"], revalidate: 60 }
);

// No purgeTag here: one caller (ensureAutoCouponRollover) runs inside the home
// page's own render, where revalidateTag is disallowed. Callers outside a
// render (route handlers) purge "settings:coupon-refresh" themselves; the
// render-path caller relies on this setting's own 60s revalidate window.
export async function setCouponRefreshSettings(
  patch: Partial<CouponRefreshSettings>
): Promise<CouponRefreshSettings> {
  const current = await getCouponRefreshSettings();
  const next: CouponRefreshSettings = { ...current, ...patch };
  await prisma.siteSetting.upsert({
    where: { key: COUPON_REFRESH_KEY },
    create: { key: COUPON_REFRESH_KEY, value: next as unknown as Prisma.InputJsonValue },
    update: { value: next as unknown as Prisma.InputJsonValue },
  });
  return next;
}

export async function getSocialSettings(): Promise<SocialSettings> {
  const all = await getAllSiteSettingsRaw();
  return (all[SOCIAL_KEY] as unknown as SocialSettings) ?? {};
}

export async function setSocialSettings(input: SocialSettings): Promise<SocialSettings> {
  const row = await prisma.siteSetting.upsert({
    where: { key: SOCIAL_KEY },
    create: { key: SOCIAL_KEY, value: input as unknown as Prisma.InputJsonValue },
    update: { value: input as unknown as Prisma.InputJsonValue },
  });
  purgeTag("settings:social");
  return row.value as unknown as SocialSettings;
}

export async function getSeoSettings(): Promise<SeoSettings> {
  const all = await getAllSiteSettingsRaw();
  return (all[SEO_KEY] as unknown as SeoSettings) ?? {};
}

export async function setSeoSettings(input: SeoSettings): Promise<SeoSettings> {
  const row = await prisma.siteSetting.upsert({
    where: { key: SEO_KEY },
    create: { key: SEO_KEY, value: input as unknown as Prisma.InputJsonValue },
    update: { value: input as unknown as Prisma.InputJsonValue },
  });
  purgeTag("settings:seo");
  return row.value as unknown as SeoSettings;
}

export async function getContentConfigSettings(): Promise<ContentConfigSettings> {
  const all = await getAllSiteSettingsRaw();
  const stored = (all[CONTENT_CONFIG_KEY] as unknown as Partial<ContentConfigSettings>) ?? {};
  return {
    pagination: { ...DEFAULT_CONTENT_CONFIG_SETTINGS.pagination, ...stored.pagination },
    templates: { ...DEFAULT_CONTENT_CONFIG_SETTINGS.templates, ...stored.templates },
  };
}

export async function setContentConfigSettings(
  input: ContentConfigSettings
): Promise<ContentConfigSettings> {
  const row = await prisma.siteSetting.upsert({
    where: { key: CONTENT_CONFIG_KEY },
    create: { key: CONTENT_CONFIG_KEY, value: input as unknown as Prisma.InputJsonValue },
    update: { value: input as unknown as Prisma.InputJsonValue },
  });
  purgeTag("settings:content-config");
  return row.value as unknown as ContentConfigSettings;
}

// Pre-rewrite footer data used either a flat { title, links: [{label,href}] }
// shape with no `type`/`items`, or (briefly) typed columns whose items
// predate the `itemId` field — either stale shape must be treated as absent
// rather than rendered, or Footer.tsx/[slug]/the admin edit-item pages break
// on the missing fields.
function isValidFooterColumns(columns: unknown): columns is FooterColumn[] {
  return (
    Array.isArray(columns) &&
    columns.every(
      (column) =>
        column &&
        typeof column === "object" &&
        ["PAGE", "PATH", "LINK"].includes((column as FooterColumn).type) &&
        Array.isArray((column as FooterColumn).items) &&
        (column as FooterColumn).items.every(
          (item) => typeof item.itemId === "string" && item.itemId.length > 0
        )
    )
  );
}

export async function getFooterSettings(): Promise<FooterSettings> {
  const all = await getAllSiteSettingsRaw();
  const stored = (all[FOOTER_KEY] as unknown as Partial<FooterSettings>) ?? {};
  return {
    columns: isValidFooterColumns(stored.columns) ? stored.columns : DEFAULT_FOOTER_SETTINGS.columns,
  };
}

export async function setFooterSettings(input: FooterSettings): Promise<FooterSettings> {
  const row = await prisma.siteSetting.upsert({
    where: { key: FOOTER_KEY },
    create: { key: FOOTER_KEY, value: input as unknown as Prisma.InputJsonValue },
    update: { value: input as unknown as Prisma.InputJsonValue },
  });
  purgeTag("settings:footer");
  return row.value as unknown as FooterSettings;
}

export async function getFooterItemById(id: string): Promise<{
  settings: FooterSettings;
  columnIndex: number;
  type: FooterColumn["type"];
  item: FooterItem;
} | null> {
  const settings = await getFooterSettings();
  for (const [columnIndex, column] of settings.columns.entries()) {
    const item = column.items.find((i) => i.itemId === id);
    if (item) return { settings, columnIndex, type: column.type, item };
  }
  return null;
}

export interface FooterPage {
  name: string;
  title: string;
  slug: string;
  description: string;
}

export async function getFooterPages(): Promise<FooterPage[]> {
  const settings = await getFooterSettings();
  return settings.columns
    .filter((column) => column.type === "PAGE" && column.isVisible)
    .flatMap((column) => column.items)
    .filter((item) => item.isVisible && item.slug && item.title && item.description)
    .map((item) => ({
      name: item.name,
      title: item.title as string,
      slug: item.slug as string,
      description: item.description as string,
    }));
}

export async function getFooterPageBySlug(slug: string): Promise<FooterPage | null> {
  const pages = await getFooterPages();
  return pages.find((page) => page.slug === slug) ?? null;
}
