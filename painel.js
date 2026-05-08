document.addEventListener("DOMContentLoaded", async () => {

  const supabaseUrl =
    "https://bjaurtrqrasznuptthyf.supabase.co";

  const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqYXVydHJxcmFzem51cHR0aHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDkwNTIsImV4cCI6MjA5MzQ4NTA1Mn0.iCQyvzAJykzgLO4kZkJZ8qNbv3549rG_JuwcVEZDrKA";

  const supabase =
    window.supabase.createClient(supabaseUrl, supabaseKey);

  const lista = document.getElementById("lista");

  let statusAtual = "booked";

  // 🔐 USER
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // 👤 PROFILE
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile) {

    document.getElementById("studioName").innerText =
      profile.studio_name || "Meu Studio";

    if (profile.logo_url) {
      document.getElementById("logo").src = profile.logo_url;
    }
  }

  function atualizarBotoesAtivos() {

    ["booked", "done", "cancelled"].forEach(status => {

      const btn = document.getElementById(`btn-${status}`);
      if (!btn) return;

      if (status === statusAtual) {

        btn.classList.add("bg-pink-500", "text-white", "shadow-lg", "scale-105");
        btn.classList.remove("bg-white", "text-gray-700");

      } else {

        btn.classList.remove("bg-pink-500", "text-white", "shadow-lg", "scale-105");
        btn.classList.add("bg-white", "text-gray-700");
      }
    });
  }

  async function carregarAgendamentos() {

    lista.innerHTML = `<div class="text-center text-gray-500 py-10">Carregando...</div>`;

    let query = supabase
      .from("appointments")
      .select("*")
      .eq("owner_id", user.id)   // 🔥 FIX PRINCIPAL
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (statusAtual === "booked") {
      query = query.or("status.eq.booked,status.is.null");
    } else {
      query = query.eq("status", statusAtual);
    }

    const { data, error } = await query;

    if (error) {
      console.log(error);
      lista.innerHTML = `<div class="text-red-500 text-center py-10">Erro ao carregar</div>`;
      return;
    }

    if (!data || data.length === 0) {
      lista.innerHTML = `<div class="text-gray-400 text-center py-10">Nenhum agendamento</div>`;
      return;
    }

    lista.innerHTML = "";

    data.forEach(item => {

      let cor = "bg-white border-pink-100";

      if (item.status === "done") cor = "bg-green-50 border-green-200";
      if (item.status === "cancelled") cor = "bg-red-50 border-red-200";

      const div = document.createElement("div");

      div.className = `p-5 rounded-3xl shadow-md border ${cor}`;

      div.innerHTML = `
        <div>
          <h2 class="font-bold text-lg">${item.name}</h2>
          <p class="text-gray-600 mt-1">💅 ${item.service}</p>
          <p class="text-sm text-gray-500 mt-1">📅 ${item.date} às ${item.time}</p>
        </div>

        ${item.status === "booked" || item.status === null ? `
          <div class="flex gap-2 mt-4">

            <button onclick="concluir(${item.id})"
              class="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-2xl font-semibold">
              Concluir
            </button>

            <button onclick="cancelar(${item.id})"
              class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-2xl font-semibold">
              Cancelar
            </button>

          </div>
        ` : ""}
      `;

      lista.appendChild(div);
    });
  }

  window.filtrar = function (status) {
    statusAtual = status;
    atualizarBotoesAtivos();
    carregarAgendamentos();
  };

  // ✅ CONCLUIR (CORRIGIDO)
  window.concluir = async function (id) {

    const { error } = await supabase
      .from("appointments")
      .update({ status: "done" })
      .eq("id", id)
      .eq("owner_id", user.id);

    if (error) {
      console.log(error);
      alert("Erro ao concluir");
      return;
    }

    carregarAgendamentos();
  };

  // ❌ CANCELAR (CORRIGIDO)
  window.cancelar = async function (id) {

    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("owner_id", user.id);

    if (error) {
      console.log(error);
      alert("Erro ao cancelar");
      return;
    }

    carregarAgendamentos();
  };

  atualizarBotoesAtivos();
  carregarAgendamentos();

});
