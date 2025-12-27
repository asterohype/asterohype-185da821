import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
    
    if (!hookSecret) {
      console.error("SEND_EMAIL_HOOK_SECRET not configured");
      throw new Error("Hook secret not configured");
    }

    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    // Verify the webhook signature
    const wh = new Webhook(hookSecret);
    
    let webhookData;
    try {
      webhookData = wh.verify(payload, headers) as {
        user: {
          id: string;
          email: string;
        };
        email_data: {
          token: string;
          token_hash: string;
          redirect_to: string;
          email_action_type: string;
          site_url: string;
        };
      };
    } catch (verifyError) {
      console.error("Webhook verification failed:", verifyError);
      return new Response(
        JSON.stringify({ error: { http_code: 401, message: "Invalid webhook signature" } }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { user, email_data } = webhookData;
    const { token_hash, redirect_to, email_action_type, site_url } = email_data;

    console.log("Processing email for:", user.email, "Action:", email_action_type);

    // Build the confirmation URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to || site_url}`;

    // Use Resend template for email confirmation
    const templateId = "ea3d1830-aba4-4489-908a-5494115f6243"; // Email Confirmation template

    // Send using template with variables
    const { error: emailError } = await resend.emails.send({
      from: "AsteroHype <onboarding@resend.dev>",
      to: [user.email],
      subject: "Confirmación de Cuenta - AsteroHype",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f9fa; color: #333; padding: 20px; margin: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .logo { background: #000; color: #fff; padding: 12px 24px; border-radius: 8px; display: inline-block; margin-bottom: 24px; font-weight: 600; }
            .logo span { color: #fbbf24; }
            h1 { color: #000; margin-bottom: 16px; font-size: 24px; }
            p { color: #666; line-height: 1.6; margin-bottom: 24px; }
            .button { display: inline-block; background: #000; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-bottom: 24px; }
            .link-section { background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
            .link-section p { color: #888; font-size: 14px; margin-bottom: 8px; }
            .link-section a { color: #666; font-size: 12px; word-break: break-all; }
            .footer { border-top: 1px solid #eee; padding-top: 24px; margin-top: 24px; }
            .footer p { color: #999; font-size: 12px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">⚡ <span>ASTEROHYPE</span></div>
            
            <h1>Confirma tu email</h1>
            <p>Haz clic en el botón de abajo para confirmar tu cuenta y acceder a Asterohype.</p>
            
            <a href="${confirmationUrl}" class="button">Confirmar Email</a>
            
            <div class="link-section">
              <p>O copia y pega este enlace en tu navegador:</p>
              <a href="${confirmationUrl}">${confirmationUrl}</a>
            </div>
            
            <div class="footer">
              <p>Si no solicitaste esta cuenta, ignora este email.</p>
              <p>© Asterohype</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      throw emailError;
    }

    console.log("Confirmation email sent successfully to:", user.email);

    return new Response(
      JSON.stringify({}),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in send-confirmation-email:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: { http_code: 500, message } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
