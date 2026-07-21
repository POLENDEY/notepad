"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidPin } from "@/lib/pin";

export type AuthState = { error?: string; success?: string };

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const pin = String(formData.get("pin") ?? "");
  const confirmPin = String(formData.get("confirmPin") ?? "");

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }
  if (!isValidPin(pin)) {
    return { error: "PIN must be exactly 6 digits." };
  }
  if (pin !== confirmPin) {
    return { error: "PINs do not match." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: pin,
    email_confirm: true,
    user_metadata: {
      display_name: displayName || email.split("@")[0],
    },
  });

  if (error) {
    return { error: error.message };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { error: "Could not create account. Try again." };
  }

  await admin.from("notepad_profiles").upsert({
    id: userId,
    email,
    display_name: displayName || null,
    pin_set_at: new Date().toISOString(),
  });

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: pin,
  });

  if (signInError) {
    return {
      error:
        "Account created, but sign-in failed. Go to Sign in and use your PIN.",
    };
  }

  const next = String(formData.get("next") ?? "").trim();
  redirect(next.startsWith("/") ? next : "/notes");
}

export async function signInWithPin(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const pin = String(formData.get("pin") ?? "");

  if (!email || !isValidPin(pin)) {
    return { error: "Enter your email and 6-digit PIN." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: pin,
  });

  if (error) {
    return { error: "Invalid email or PIN. Try again." };
  }

  const next = String(formData.get("next") ?? "").trim();
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function changePin(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const currentPin = String(formData.get("currentPin") ?? "");
  const newPin = String(formData.get("newPin") ?? "");
  const confirmPin = String(formData.get("confirmPin") ?? "");

  if (!isValidPin(currentPin) || !isValidPin(newPin)) {
    return { error: "PINs must be exactly 6 digits." };
  }
  if (newPin !== confirmPin) {
    return { error: "New PINs do not match." };
  }
  if (currentPin === newPin) {
    return { error: "Choose a different PIN." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Not signed in." };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPin,
  });

  if (verifyError) {
    return { error: "Current PIN is incorrect." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPin,
  });

  if (updateError) {
    return { error: updateError.message };
  }

  await supabase
    .from("notepad_profiles")
    .update({ pin_set_at: new Date().toISOString() })
    .eq("id", user.id);

  return { success: "PIN updated successfully." };
}

export async function updateDisplayName(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not signed in." };
  }

  const { error } = await supabase
    .from("notepad_profiles")
    .update({ display_name: displayName || null })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { success: "Profile updated." };
}
