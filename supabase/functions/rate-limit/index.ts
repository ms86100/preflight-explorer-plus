import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  validateRateLimitRequest,
  createValidationErrorResponse,
} from "../_shared/validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limit configurations per endpoint type
const RATE_LIMITS: Record<string, { maxRequests: number; windowMinutes: number }> = {
  // Auth endpoints - stricter limits to prevent brute force
  "auth/login": { maxRequests: 10, windowMinutes: 1 },
  "auth/signup": { maxRequests: 5, windowMinutes: 1 },
  "auth/reset": { maxRequests: 3, windowMinutes: 1 },
  
  // Read operations - more generous
  "api/read": { maxRequests: 200, windowMinutes: 1 },
  "api/list": { maxRequests: 100, windowMinutes: 1 },
  
  // Write operations - moderate limits
  "api/write": { maxRequests: 60, windowMinutes: 1 },
  "api/update": { maxRequests: 60, windowMinutes: 1 },
  "api/delete": { maxRequests: 30, windowMinutes: 1 },
  
  // File uploads - strict limits
  "api/upload": { maxRequests: 20, windowMinutes: 1 },
  
  // Search - moderate limits
  "api/search": { maxRequests: 50, windowMinutes: 1 },
  
  // Default fallback
  "default": { maxRequests: 100, windowMinutes: 1 },
};

interface RateLimitResponse {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  limit: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client for rate limit operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate request
    const body = await req.json();
    const validation = validateRateLimitRequest(body);
    
    if (!validation.success) {
      console.log("[Rate Limit] Validation failed:", validation.errors);
      return createValidationErrorResponse(validation.errors!, corsHeaders);
    }

    const { endpoint, identifier: providedIdentifier } = validation.data!;

    // Determine identifier: use provided, or extract from auth header, or use IP
    let identifier = providedIdentifier;
    
    if (!identifier) {
      // Try to get user ID from auth header
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) {
          identifier = `user:${user.id}`;
        }
      }
    }
    
    if (!identifier) {
      // Fall back to IP address
      const forwardedFor = req.headers.get("x-forwarded-for");
      const realIp = req.headers.get("x-real-ip");
      identifier = `ip:${forwardedFor?.split(",")[0] || realIp || "unknown"}`;
    }

    // Get rate limit config for this endpoint
    const config = RATE_LIMITS[endpoint] || RATE_LIMITS["default"];

    console.log(`[Rate Limit] Checking: ${identifier} -> ${endpoint} (limit: ${config.maxRequests}/${config.windowMinutes}min)`);

    // Check rate limit using database function
    const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: config.maxRequests,
      p_window_minutes: config.windowMinutes,
    });

    if (error) {
      console.error("[Rate Limit] Database error:", error);
      // On error, allow the request but log it
      return new Response(
        JSON.stringify({
          allowed: true,
          remaining: config.maxRequests,
          resetAt: new Date(Date.now() + config.windowMinutes * 60000).toISOString(),
          limit: config.maxRequests,
          warning: "Rate limit check failed, request allowed",
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const result = data?.[0];
    const response: RateLimitResponse = {
      allowed: result?.allowed ?? true,
      remaining: result?.remaining ?? config.maxRequests,
      resetAt: result?.reset_at ?? new Date(Date.now() + config.windowMinutes * 60000).toISOString(),
      limit: config.maxRequests,
    };

    console.log(`[Rate Limit] Result: ${identifier} -> ${endpoint}: allowed=${response.allowed}, remaining=${response.remaining}`);

    // Return appropriate status based on rate limit
    const status = response.allowed ? 200 : 429;
    
    return new Response(
      JSON.stringify(response),
      { 
        status, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-RateLimit-Limit": config.maxRequests.toString(),
          "X-RateLimit-Remaining": response.remaining.toString(),
          "X-RateLimit-Reset": response.resetAt,
        } 
      }
    );

  } catch (error) {
    console.error("[Rate Limit] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
