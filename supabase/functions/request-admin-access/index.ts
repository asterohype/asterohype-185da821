import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "neomaffofficial@gmail.com";
const VALID_INVITATION_CODE = "CIoMaaffsiXXfledd11978";

interface AdminRequestPayload {
  invitationCode: string;
  deviceInfo?: string;
}

// Generate HMAC signature using Web Crypto API
async function generateHmacSignature(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  return base64Encode(signature).replace(/[+/=]/g, (c) => 
    c === '+' ? '-' : c === '/' ? '_' : ''
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get the user from the auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const { invitationCode, deviceInfo }: AdminRequestPayload = await req.json();

    // Validate invitation code
    if (invitationCode !== VALID_INVITATION_CODE) {
      return new Response(
        JSON.stringify({ error: "Código de invitación inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get IP - mask last octet for privacy
    const rawIp = req.headers.get("x-forwarded-for") || 
                  req.headers.get("cf-connecting-ip") || 
                  "Unknown";
    const ipParts = rawIp.split(".");
    const ipAddress = ipParts.length === 4 
      ? `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.***` 
      : "Masked";

    // Create admin client for inserting the request
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already has a pending request
    const { data: existingRequest } = await supabaseAdmin
      .from("admin_requests")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existingRequest) {
      return new Response(
        JSON.stringify({ error: "Ya tienes una solicitud pendiente", status: "pending" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already admin
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (existingRole) {
      return new Response(
        JSON.stringify({ error: "Ya eres administrador", status: "approved" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize device info - limit length and remove potentially dangerous characters
    const sanitizedDeviceInfo = deviceInfo 
      ? deviceInfo.slice(0, 500).replace(/[<>]/g, '') 
      : "No disponible";

    // Insert the admin request - store minimal data
    const { data: adminRequest, error: insertError } = await supabaseAdmin
      .from("admin_requests")
      .insert({
        user_id: user.id,
        user_email: user.email,
        invitation_code: "VALID", // Don't store actual code
        device_info: sanitizedDeviceInfo,
        ip_address: ipAddress,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting admin request:", insertError);
      throw new Error("Failed to create admin request");
    }

    // Generate expiring HMAC signatures (24 hours)
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
    const approveSignature = await generateHmacSignature(
      `${adminRequest.id}:approve:${expiresAt}`, 
      supabaseServiceKey
    );
    const rejectSignature = await generateHmacSignature(
      `${adminRequest.id}:reject:${expiresAt}`, 
      supabaseServiceKey
    );

    const approveUrl = `${supabaseUrl}/functions/v1/approve-admin-request?requestId=${adminRequest.id}&action=approve&expires=${expiresAt}&sig=${approveSignature}`;
    const rejectUrl = `${supabaseUrl}/functions/v1/approve-admin-request?requestId=${adminRequest.id}&action=reject&expires=${expiresAt}&sig=${rejectSignature}`;

    // Format date
    const requestDate = new Date().toLocaleString("es-ES", {
      timeZone: "Europe/Madrid",
      dateStyle: "full",
      timeStyle: "long",
    });

    // Send email to admin
    const emailResponse = await resend.emails.send({
      from: "AsteroHype <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: "🔐 Nueva Solicitud de Acceso Admin - AsteroHype",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fff; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #111; border-radius: 12px; padding: 32px; }
            h1 { color: #fbbf24; margin-bottom: 24px; }
            .info-row { padding: 12px 0; border-bottom: 1px solid #222; }
            .label { color: #888; font-size: 12px; text-transform: uppercase; }
            .value { color: #fff; font-size: 16px; margin-top: 4px; }
            .button { display: inline-block; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 8px 8px 8px 0; }
            .approve { background: #22c55e; color: #000; }
            .reject { background: #ef4444; color: #fff; }
            .buttons { margin-top: 24px; }
            .warning { color: #fbbf24; font-size: 12px; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔐 Nueva Solicitud de Admin</h1>
            
            <div class="info-row">
              <div class="label">Usuario</div>
              <div class="value">${user.email || "No email"}</div>
            </div>
            
            <div class="info-row">
              <div class="label">ID de Usuario</div>
              <div class="value">${user.id}</div>
            </div>
            
            <div class="info-row">
              <div class="label">Fecha y Hora</div>
              <div class="value">${requestDate}</div>
            </div>
            
            <div class="info-row">
              <div class="label">Región IP</div>
              <div class="value">${ipAddress}</div>
            </div>
            
            <div class="info-row">
              <div class="label">Dispositivo</div>
              <div class="value">${sanitizedDeviceInfo}</div>
            </div>
            
            <div class="buttons">
              <a href="${approveUrl}" class="button approve">✓ Aprobar</a>
              <a href="${rejectUrl}" class="button reject">✗ Rechazar</a>
            </div>
            
            <p class="warning">⚠️ Estos enlaces expiran en 24 horas</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Solicitud enviada. Recibirás una respuesta pronto.",
        requestId: adminRequest.id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in request-admin-access:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});