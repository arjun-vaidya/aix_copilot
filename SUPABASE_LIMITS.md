# Supabase Auth Usage & Rate Limits (2024-2025)

This document outlines the authentication capacities for the AI4Numerics platform based on the current Supabase tier structure.

## 1. Monthly Active Users (MAU)
An MAU is counted as any unique user who signs in or refreshes their session token within a 30-day billing cycle.

| Tier | Included MAUs | Over-usage Cost |
| :--- | :--- | :--- |
| **Free** | **50,000** | $0.00325 per additional MAU |
| **Pro** | **100,000** | $0.00325 per additional MAU |
| **Team/Enterprise** | **Unlimited/Custom** | Configurable |

> [!NOTE]
> For our target of ~200 students per semester, the **Free Tier** is more than sufficient.

## 2. Recommended Classroom Configuration
To ensure 200 students can sign up simultaneously without friction:

| Setting | Recommendation | Reason |
| :--- | :--- | :--- |
| **Enable Email Signup** | **ON** | Allows users to create accounts via email/password. |
| **Confirm Email** | **OFF** | Skips the "Check your inbox" step. Students log in instantly. |
| **Password Complexity** | **Low (6 chars)** | Simplifies onboarding; restricts fewer common passwords. |

> [!TIP]
> You can find these under **Authentication > Providers > Email** and **Authentication > Auth Settings** in the Supabase Dashboard.

## 3. Rate Limits (Default)
Supabase enforces these limits to prevent brute-force attacks and abuse.

| Endpoint / Action | Limit | Window |
| :--- | :--- | :--- |
| **Sign Up / Login** | 30 requests | 5 seconds (per IP) |
| **Password Reset** | 3 requests | 1 hour (per user) |
| **OTP / Magic Link** | 3 requests | 1 hour (per user) |
| **Email Change** | 3 requests | 1 hour (per user) |

## 3. Transactional Email Limits
When using the Supabase built-in email provider (without custom SMTP):
- **Limit:** 3 emails per hour.
- **Recommendation:** For a course with 200 students, if everyone signs up at once, the built-in provider will hit limits. **We should use a custom SMTP provider (like Resend, SendGrid, or AWS SES)** in the Supabase Dashboard settings to avoid this.

## 4. Database & Connection Limits (Free Tier)
- **Database Size:** 500MB (Postgres).
- **Concurrent Connections:** 60.
- **Edge Function Invocations:** 500,000 per month.

---
*Source: [Supabase Pricing & Limits](https://supabase.com/pricing)*
