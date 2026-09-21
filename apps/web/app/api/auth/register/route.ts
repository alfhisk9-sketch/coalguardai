import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { toErrorResponse } from "../../../../lib/errors";

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters."),
  email: z.string().trim().email("Please provide a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  roleKey: z.string().trim(),
  mineId: z.string().uuid("Invalid mine identifier.").optional().nullable(),
  contractorId: z.string().uuid("Invalid contractor identifier.").optional().nullable(),
});

// Explicit allowlist of roles accessible via public self-registration
const ALLOWED_PUBLIC_ROLES = ["MINE_MANAGER", "REGULATOR", "INSPECTOR", "CONTRACTOR"] as const;
const PRIVILEGED_BLOCKED_ROLES = ["SUPER_ADMIN", "CORPORATE_ADMIN"] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parseResult = registerSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0]?.message || "Invalid registration payload.";
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: issue } },
        { status: 400 }
      );
    }

    const { fullName, email, password, roleKey, mineId, contractorId } = parseResult.data;

    // Security Gate 1: Check for privileged roles (super_admin / corporate_admin)
    if (PRIVILEGED_BLOCKED_ROLES.includes(roleKey.toUpperCase() as any)) {
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "Privileged administrator roles cannot be self-selected through public registration.",
          },
        },
        { status: 403 }
      );
    }

    // Security Gate 2: Validate against allowed public roles
    if (!ALLOWED_PUBLIC_ROLES.includes(roleKey as any)) {
      return NextResponse.json(
        {
          error: {
            code: "BAD_REQUEST",
            message: `Role '${roleKey}' is not a valid public role. Choose from: Mine Manager, Safety Officer, Inspector, or Contractor.`,
          },
        },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const serviceRoleKey = rawServiceKey ? rawServiceKey.replace(/^["']|["']$/g, "").trim() : null;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: { code: "CONFIGURATION_ERROR", message: "Server authentication service is temporarily unavailable." } },
        { status: 500 }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Validate role exists in roles table
    let roleRecord: { id: string; key: string; name: string } | null = null;
    const { data: adminRoleRecord, error: roleError } = await adminClient
      .from("roles")
      .select("id, key, name")
      .eq("key", roleKey)
      .single();

    if (!roleError && adminRoleRecord) {
      roleRecord = adminRoleRecord;
    } else if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      // Fallback to reading public roles table via anon client
      try {
        const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        const { data: anonRole } = await anonClient
          .from("roles")
          .select("id, key, name")
          .eq("key", roleKey)
          .single();
        if (anonRole) roleRecord = anonRole;
      } catch {
        // Fallback failed
      }
    }

    if (!roleRecord) {
      return NextResponse.json(
        { error: { code: "ROLE_NOT_FOUND", message: `Role '${roleKey}' could not be resolved in the statutory role registry.` } },
        { status: 400 }
      );
    }

    // Validate mine if provided
    let effectiveMineId: string | null = mineId ?? null;
    let effectiveContractorId: string | null = contractorId ?? null;

    if (effectiveMineId) {
      const { data: mineRecord } = await adminClient
        .from("mines")
        .select("id, status")
        .eq("id", effectiveMineId)
        .maybeSingle();

      if (!mineRecord) {
        return NextResponse.json(
          { error: { code: "INVALID_MINE", message: "The requested mine does not exist in the statutory mine registry." } },
          { status: 400 }
        );
      }
    }

    // If contractor role, validate contractor company
    if (roleKey === "CONTRACTOR") {
      if (effectiveContractorId) {
        const { data: contractorRecord } = await adminClient
          .from("contractors")
          .select("id, mine_id, status")
          .eq("id", effectiveContractorId)
          .maybeSingle();

        if (!contractorRecord) {
          return NextResponse.json(
            { error: { code: "INVALID_CONTRACTOR", message: "The specified contractor company does not exist." } },
            { status: 400 }
          );
        }
        if (!effectiveMineId && contractorRecord.mine_id) {
          effectiveMineId = contractorRecord.mine_id;
        }
      }
    }

    // If role is MINE_MANAGER, REGULATOR, or INSPECTOR, a mine assignment is required for operational scope
    if (!effectiveMineId && roleKey !== "CONTRACTOR") {
      // Default to Shakti Open Cast Mine if none selected to guarantee authorized scope
      const { data: defaultMine } = await adminClient
        .from("mines")
        .select("id")
        .eq("code", "SHK-DEMO")
        .maybeSingle();

      effectiveMineId = defaultMine?.id ?? null;
    }

    // Step 1: Create or fetch auth user safely
    let userId: string;
    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        requested_role: roleKey,
        assigned_mine_id: effectiveMineId,
      },
    });

    if (createError) {
      if (createError.message?.toLowerCase().includes("already registered") || createError.status === 422) {
        return NextResponse.json(
          { error: { code: "USER_EXISTS", message: "An account with this email address is already registered. Please sign in." } },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: { code: "AUTH_CREATION_FAILED", message: createError.message || "Failed to create user authentication." } },
        { status: 400 }
      );
    }

    userId = createData.user.id;

    // Step 2: Atomic profile creation
    const { error: profileError } = await adminClient.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName,
        email: email,
        contractor_id: effectiveContractorId,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (profileError) {
      // Cleanup orphan auth user if profile insertion failed
      await adminClient.auth.admin.deleteUser(userId).catch(() => {});
      return NextResponse.json(
        { error: { code: "PROFILE_CREATION_FAILED", message: "Failed to create application profile." } },
        { status: 500 }
      );
    }

    // Step 3: Atomic user_roles assignment
    const { error: roleAssignError } = await adminClient.from("user_roles").upsert(
      {
        user_id: userId,
        role_id: roleRecord.id,
        mine_id: effectiveMineId,
      },
      { onConflict: "user_id,role_id,mine_id" }
    );

    if (roleAssignError) {
      try {
        await adminClient.from("user_roles").insert({
          user_id: userId,
          role_id: roleRecord.id,
          mine_id: effectiveMineId,
        });
      } catch {
        // Ignore fallback duplicate
      }
    }

    return NextResponse.json(
      {
        data: {
          userId,
          fullName,
          email,
          roleKey,
          roleName: roleRecord.name,
          mineId: effectiveMineId,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
