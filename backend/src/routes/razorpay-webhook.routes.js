import { Router } from "express";
import crypto from "node:crypto";

import { processSubscriptionActivated } from "../services/razorpay-webhook.service.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Razorpay webhook secret is missing");

      return res.status(503).json({
        error: "Webhook is not configured",
      });
    }

    const signature = req.headers["x-razorpay-signature"];

    if (typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)) {
      return res.status(400).json({
        error: "Invalid webhook signature",
      });
    }

    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({
        error: "Invalid webhook body",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body)
      .digest("hex");

    const receivedBuffer = Buffer.from(signature, "hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      return res.status(400).json({
        error: "Invalid webhook signature",
      });
    }

    let event;

    try {
      event = JSON.parse(req.body.toString("utf8"));
    } catch {
      return res.status(400).json({
        error: "Invalid webhook JSON",
      });
    }

    if (!event || typeof event.event !== "string") {
      return res.status(400).json({
        error: "Invalid webhook event",
      });
    }

    const eventId = req.headers["x-razorpay-event-id"];

    console.log("Verified Razorpay webhook:", event.event);

    switch (event.event) {
      case "subscription.activated": {
        if (typeof eventId !== "string" || !eventId.trim()) {
          return res.status(400).json({
            error: "Missing Razorpay event ID",
          });
        }

        const result = await processSubscriptionActivated(event, eventId);

        console.log("Subscription activation result:", result);

        return res.status(200).json({
          received: true,
          result,
        });
      }

      default:
        // We haven't implemented other event
        // types yet, so don't acknowledge them
        // as successfully processed.
        return res.status(503).json({
          error: "Webhook event handler not implemented",
        });
    }
  } catch (error) {
    console.error("Razorpay webhook processing failed:", error.message);

    // Razorpay can retry unsuccessful webhook
    // deliveries when configured.
    return res.status(503).json({
      error: "Webhook processing failed",
    });
  }
});

export default router;
