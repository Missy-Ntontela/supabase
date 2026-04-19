// ================= SUPABASE =================
const SUPABASE_URL = "https://ixikhufrylaugpdxokwu.supabase.co";
const SUPABASE_KEY = "sb_publishable_7T38wLjTEs7UJKMMTxl9tQ_OLM6Wsf3";

// IMPORTANT: avoid naming conflict
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ================= STATE =================
let isLogin = true;

// ================= TOGGLE =================
function toggleMode() {
  isLogin = !isLogin;
  document.getElementById("title").innerText = isLogin ? "Login" : "Sign Up";
  document.getElementById("btn").innerText = isLogin ? "Login" : "Sign Up";
}

// ================= AUTH =================
async function handleAuth() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("msg");

  if (!email || !password) {
    msg.innerText = "Fill all fields";
    return;
  }

  if (isLogin) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) return msg.innerText = error.message;

    await routeUser();
  } else {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password
    });

    if (error) return msg.innerText = error.message;

    // DEFAULT ROLE = patient (SECURE)
    await supabaseClient.from("profiles").insert([
      {
        id: data.user.id,
        email,
        role: "patient"
      }
    ]);

    msg.innerText = "Signup successful. Please login.";
  }
}

// ================= GOOGLE LOGIN =================
async function googleLogin() {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin
    }
  });

  if (error) console.log(error.message);
}

// ================= ROUTING =================
async function routeUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    await supabaseClient.from("profiles").insert([
      { id: user.id, role: "patient" }
    ]);
    window.location.href = "patient.html";
    return;
  }

  if (profile.role === "admin") {
    window.location.href = "admin.html";
  } else if (profile.role === "staff") {
    window.location.href = "staff.html";
  } else {
    window.location.href = "patient.html";
  }
}

// ================= SESSION HANDLING =================
supabaseClient.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_IN") {
    routeUser();
  }

  if (event === "SIGNED_OUT") {
    window.location.href = "index.html";
  }
});

// ================= LOGOUT =================
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

// ================= PROTECT PAGES =================
async function protectPage(requiredRole) {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== requiredRole) {
    alert("Access denied");
    window.location.href = "index.html";
  }
}
