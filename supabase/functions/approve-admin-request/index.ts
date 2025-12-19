import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const requestId = url.searchParams.get("requestId");
    const action = url.searchParams.get("action");
    const secret = url.searchParams.get("secret");

    if (!requestId || !action) {
      return new Response(
        generateHtmlResponse("Error", "Parámetros inválidos", false),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Simple secret validation (last 10 chars of service key)
    const expectedSecret = supabaseServiceKey.slice(-10);
    if (secret !== expectedSecret) {
      return new Response(
        generateHtmlResponse("Error", "No autorizado", false),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the admin request
    const { data: adminRequest, error: fetchError } = await supabase
      .from("admin_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !adminRequest) {
      console.error("Error fetching request:", fetchError);
      return new Response(
        generateHtmlResponse("Error", "Solicitud no encontrada", false),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    if (adminRequest.status !== "pending") {
      return new Response(
        generateHtmlResponse("Ya Procesada", `Esta solicitud ya fue ${adminRequest.status === "approved" ? "aprobada" : "rechazada"}`, adminRequest.status === "approved"),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    if (action === "approve") {
      // Add admin role to user
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: adminRequest.user_id,
          role: "admin",
        });

      if (roleError) {
        console.error("Error adding admin role:", roleError);
        return new Response(
          generateHtmlResponse("Error", "No se pudo asignar el rol de admin", false),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html" } }
        );
      }

      // Update request status
      await supabase
        .from("admin_requests")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", requestId);

      return new Response(
        generateHtmlResponse("✅ Aprobado", `El usuario ${adminRequest.user_email} ahora es administrador`, true),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );

    } else if (action === "reject") {
      // Update request status
      await supabase
        .from("admin_requests")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", requestId);

      return new Response(
        generateHtmlResponse("❌ Rechazado", `La solicitud de ${adminRequest.user_email} ha sido rechazada`, false),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    return new Response(
      generateHtmlResponse("Error", "Acción no válida", false),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html" } }
    );

  } catch (error: unknown) {
    console.error("Error in approve-admin-request:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return new Response(
      generateHtmlResponse("Error", message, false),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html" } }
    );
  }
});

function generateHtmlResponse(title: string, message: string, success: boolean): string {
  const bgColor = success ? "#22c55e" : "#ef4444";
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title} - AsteroHype Admin</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #0a0a0a;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
        }
        .card {
          background: #111;
          border-radius: 16px;
          padding: 48px;
          text-align: center;
          max-width: 400px;
          border: 1px solid #222;
        }
        .icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: ${bgColor};
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 36px;
        }
        h1 { margin: 0 0 16px; color: #fff; }
        p { color: #888; margin: 0; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">${success ? "✓" : "✗"}</div>
        <h1>${title}</h1>
        <p>${message}</p>
      </div>
    </body>
    </html>
  `;
}