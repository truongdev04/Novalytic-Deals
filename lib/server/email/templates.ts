function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function newsletterConfirmEmail(confirmUrl: string) {
  return {
    subject: "Confirm your NovalyticDeals newsletter subscription",
    html: `<p>Thanks for subscribing to NovalyticDeals!</p>
<p><a href="${confirmUrl}">Click here to confirm your subscription</a>.</p>
<p>If you didn't request this, you can ignore this email.</p>`,
  };
}

export function contactNotificationEmail(name: string, email: string, message: string) {
  return {
    subject: `New contact message from ${escapeHtml(name)}`,
    html: `<p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p><p>${escapeHtml(message)}</p>`,
  };
}

export function submitCouponNotificationEmail(storeName: string, description: string) {
  return {
    subject: `New coupon submission: ${escapeHtml(storeName)}`,
    html: `<p><strong>Store:</strong> ${escapeHtml(storeName)}</p><p>${escapeHtml(description)}</p>`,
  };
}
