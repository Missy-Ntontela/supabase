const SUPABASE_URL = "https://ixikhufrylaugpdxokwu.supabase.co";
const SUPABASE_KEY = "sb_publishable_7T38wLjTEs7UJKMMTxl9tQ_OLM6Wsf3";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function pageForRole(role) {
  if (role === "admin") return "admin.html";
  if (role === "staff") return "staff.html";
  return "patient.html";
}

function needsOnboarding(user) {
  if (!user) return true;
  const hasName = user.full_name && user.full_name.trim().length > 0;
  const hasPhone = user.phone && user.phone.trim().length > 0;
  return !hasName || !hasPhone;
}

async function getCurrentUserRow() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return null;

  const { data } = await supabaseClient
    .from("users")
    .select("id, email, full_name, phone, role, alternate_contact, gender, occupation, address, allergies")
    .eq("id", user.id)
    .maybeSingle();

  return data;
}

async function routeUser() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "index.html";
    return;
  }

  const row = await getCurrentUserRow();

  if (!row || needsOnboarding(row)) {
    window.location.href = "onboarding.html";
    return;
  }

  window.location.href = pageForRole(row.role);
}

async function routeIfAuthenticated() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return false;
  await routeUser();
  return true;
}

supabaseClient.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") {
    window.location.href = new URL("index.html", window.location.href).href;
  }
});

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

async function protectPage(requiredRole) {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "index.html";
    return;
  }

  const row = await getCurrentUserRow();

  if (!row || needsOnboarding(row)) {
    window.location.href = "onboarding.html";
    return;
  }

  if (row.role !== requiredRole) {
    window.location.href = pageForRole(row.role);
  }
}
