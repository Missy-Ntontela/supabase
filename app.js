const SUPABASE_URL = "https://ixikhufrylaugpdxokwu.supabase.co";
const SUPABASE_KEY = "sb_publishable_7T38wLjTEs7UJKMMTxl9tQ_OLM6Wsf3";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let isLogin = true;

function toggleMode() {
  isLogin = !isLogin;
  document.getElementById("title").innerText = isLogin ? "Login" : "Sign Up";
  document.getElementById("btn").innerText = isLogin ? "Login" : "Sign Up";
}

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

async function googleLogin() {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: new URL("auth/callback.html", window.location.href).href
    }
  });

  if (error) console.log(error.message);
}

function pageForRole(role) {
  if (role === "admin") return "admin.html";
  if (role === "staff") return "staff.html";
  return "patient.html";
}

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
      { id: user.id, email: user.email, role: "patient" }
    ]);
    window.location.href = "patient.html";
    return;
  }

  window.location.href = pageForRole(profile.role);
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
