import crypto from "node:crypto";

import { Router } from "express";

import { supabase } from "../config/supabase.js";
import { supabaseAdmin } from "../config/supabase-admin.js";
import { razorpay } from "../config/razorpay.js";

const router = Router();

const PLANS = {
  starter: process.env.RAZORPAY_STARTER_PLAN_ID,
  pro: process.env.RAZORPAY_PRO_PLAN_ID,
};

router.post("/create", async (req, res) => {
  try {
    // 1. Verify authentication
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        error: "Invalid authentication token",
      });
    }

    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return res.status(401).json({
        error: "Invalid or expired session",
      });
    }

    const user = authData.user;

    // 2. Validate the selected plan
    const { plan } = req.body ?? {};

    if (
      typeof plan !== "string" ||
      !Object.hasOwn(PLANS, plan) ||
      !PLANS[plan]
    ) {
      return res.status(400).json({
        error: "Invalid subscription plan",
      });
    }

    // 3. Find the user's organization
    const { data: organization, error: orgError } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (orgError || !organization) {
      return res.status(403).json({
        error: "Organization not found",
      });
    }

    // 4. Check for an existing subscription
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("organization_subscriptions")
      .select("id, plan_id, status, razorpay_subscription_id")
      .eq("organization_id", organization.id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      if (existing.plan_id !== plan) {
        return res.status(409).json({
          error: "A subscription record already exists for another plan",
        });
      }

      if (existing.razorpay_subscription_id) {
        if (existing.status === "pending") {
          const razorpaySubscription = await razorpay.subscriptions.fetch(
            existing.razorpay_subscription_id,
          );

          if (razorpaySubscription.status === "created") {
            return res.status(200).json({
              subscription_id: razorpaySubscription.id,
              status: razorpaySubscription.status,
              plan,
              key_id: process.env.RAZORPAY_KEY_ID,
              resumed: true,
            });
          }
        }

        return res.status(409).json({
          error:
            "An existing subscription cannot be restarted through checkout",
        });
      }

      return res.status(409).json({
        error: "A pending subscription requires reconciliation before retrying",
      });
    }

    // 5. Reserve the subscription in Supabase
    const { data: pending, error: insertError } = await supabaseAdmin
      .from("organization_subscriptions")
      .insert({
        organization_id: organization.id,
        plan_id: plan,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      // A concurrent request may have inserted a record.
      if (insertError.code === "23505") {
        return res.status(409).json({
          error: "A subscription request already exists",
        });
      }

      throw insertError;
    }

    // 6. Create the Razorpay subscription
    let subscription;

    try {
      subscription = await razorpay.subscriptions.create({
        plan_id: PLANS[plan],
        total_count: 12,
        quantity: 1,
        notes: {
          organization_id: organization.id,
          user_id: user.id,
          local_subscription_id: pending.id,
          plan,
        },
      });
    } catch (error) {
      console.error("Razorpay subscription request failed:", {
        statusCode: error.statusCode,
        error: error.error,
        message: error.message,
        localSubscriptionId: pending.id,
      });

      // Do not delete the pending record.
      // Razorpay may have created the subscription
      // even if the response was lost.
      return res.status(502).json({
        error:
          "Subscription creation could not be confirmed. Please contact support before retrying.",
      });
    }

    // 7. Save the Razorpay subscription ID
    const { error: updateError } = await supabaseAdmin
      .from("organization_subscriptions")
      .update({
        razorpay_subscription_id: subscription.id,
      })
      .eq("id", pending.id)
      .eq("status", "pending");

    if (updateError) {
      console.error(
        "Failed to save Razorpay subscription:",
        subscription.id,
        updateError.message,
      );

      return res.status(500).json({
        error:
          "Subscription was created but could not be linked. Please contact support.",
      });
    }

    // 8. Return checkout details
    return res.status(201).json({
      subscription_id: subscription.id,
      status: subscription.status,
      plan,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Subscription creation failed:", error.message);

    return res.status(500).json({
      error: "Unable to create subscription",
    });
  }
});

router.get("/current", async (req, res) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        error: "Invalid authentication token",
      });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        error: "Invalid or expired session",
      });
    }

    const { data: organization, error: orgError } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (orgError || !organization) {
      return res.status(403).json({
        error: "Organization not found",
      });
    }

    const { data: subscription, error: subError } = await supabaseAdmin
      .from("organization_subscriptions")
      .select("plan_id, status, razorpay_subscription_id")
      .eq("organization_id", organization.id)
      .maybeSingle();

    if (subError) throw subError;

    return res.json({
      subscription: subscription ?? null,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Fetching subscription failed:", error.message);

    return res.status(500).json({
      error: "Unable to fetch subscription",
    });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const token = authorization.slice(7).trim();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        error: "Invalid or expired session",
      });
    }

    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = req.body ?? {};

    if (
      ![
        razorpay_payment_id,
        razorpay_subscription_id,
        razorpay_signature,
      ].every((value) => typeof value === "string" && value.length > 0)
    ) {
      return res.status(400).json({
        error: "Missing payment verification details",
      });
    }

    const { data: organization, error: orgError } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (orgError || !organization) {
      return res.status(403).json({
        error: "Organization not found",
      });
    }

    const { data: subscription, error: subError } = await supabaseAdmin
      .from("organization_subscriptions")
      .select("id, razorpay_subscription_id")
      .eq("organization_id", organization.id)
      .maybeSingle();

    if (subError) throw subError;

    if (
      !subscription ||
      subscription.razorpay_subscription_id !== razorpay_subscription_id
    ) {
      return res.status(403).json({
        error: "Subscription does not belong to this organization",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    const received = Buffer.from(razorpay_signature, "hex");

    const expected = Buffer.from(expectedSignature, "hex");

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(received, expected)
    ) {
      return res.status(400).json({
        error: "Invalid payment signature",
      });
    }

    return res.status(200).json({
      verified: true,
      message: "Payment signature verified. Awaiting webhook confirmation.",
    });
  } catch (error) {
    console.error("Payment verification failed:", error.message);

    return res.status(500).json({
      error: "Unable to verify payment",
    });
  }
});

export default router;
