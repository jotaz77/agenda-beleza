document.addEventListener("DOMContentLoaded", async () => {

  // 🔗 SUPABASE
  const supabaseUrl = "https://bjaurtrqrasznuptthyf.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqYXVydHJxcmFzem51cHR0aHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDkwNTIsImV4cCI6MjA5MzQ4NTA1Mn0.iCQyvzAJykzgLO4kZkJZ8qNbv3549rG_JuwcVEZDrKA";

  const supabase = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
  );

  const lista = document.getElementById("lista");

  let statusAtual = "booked";

  // 🔐 USUÁRIO
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // 👤 PEGAR PERFIL
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 🎨 MOSTRAR PERFIL
  if (profile) {

    document.getElementById("studioName").innerText =
      profile.studio_name || "Meu Studio";

    if (profile.logo_url) {
      document.getElementById("logo").src =
        profile.logo_url;
    }

  }

  // 🎯 BOTÕES ATIVOS
  function atualizarBotoesAtivos() {

    const botoes = [
      "booked",
      "done",
      "cancelled"
    ];

    botoes.forEach(status => {

      const btn =
        document.getElementById(`btn-${status}`);

      if (!btn) return;

      if (status === statusAtual) {

        btn.classList.add(
          "bg-pink-500",
          "text-white"
        );

        btn.classList.remove(
          "bg-white",
          "text-gray-700"
        );

      } else {

        btn.classList.remove(
          "bg-pink-500",
          "text-white"
        );

        btn.classList.add(
          "bg-white",
          "text-gray-700"
        );
      }

    });

  }

  // 📥 CARREGAR AGENDAMENTOS
  async function carregarAgendamentos() {

    lista.innerHTML = "Carregando...";

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", user.id)
      .or(`status.ilike.${statusAtual},status.is.null`)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) {
      console.log(error);
      lista.innerHTML = "Erro ao carregar";
      return;
    }

    if (!data || data.length === 0) {
      lista.innerHTML = "Nenhum agendamento";
      return;
    }

    lista.innerHTML = "";

    data.forEach(item => {

      const div = document.createElement("div");

      let cor = "bg-white";

      if (item.status === "done")
        cor = "bg-green-100";

      if (item.status === "cancelled")
        cor = "bg-red-100";

      div.className =
        `p-4 rounded-2xl shadow ${cor}`;

      div.innerHTML = `
        <p class="font-bold text-lg">
          ${item.name}
        </p>

        <p class="mt-1">
          💅 ${item.service}
        </p>

        <p class="text-sm text-gray-600 mt-1">
          📅 ${item.date} às ${item.time}
        </p>

        ${
          item.status === "booked" ||
          item.status === null

            ? `
          <div class="mt-3 flex gap-2">

            <button
              onclick="concluir(${item.id})"
              class="bg-green-500 text-white px-3 py-1 rounded-xl"
            >
              Concluir
            </button>

            <button
              onclick="cancelar(${item.id})"
              class="bg-red-500 text-white px-3 py-1 rounded-xl"
            >
              Cancelar
            </button>

          </div>
        `
            : ""
        }
      `;

      lista.appendChild(div);

    });

  }

  // 🔄 FILTRAR
  window.filtrar = function (status) {

    statusAtual = status;

    atualizarBotoesAtivos();

    carregarAgendamentos();
  };

  // ✅ CONCLUIR
  window.concluir = async function (id) {

    await supabase
      .from("appointments")
      .update({
        status: "done"
      })
      .eq("id", id)
      .eq("user_id", user.id);

    carregarAgendamentos();
  };

  // ❌ CANCELAR
  window.cancelar = async function (id) {

    await supabase
      .from("appointments")
      .update({
        status: "cancelled"
      })
      .eq("id", id)
      .eq("user_id", user.id);

    carregarAgendamentos();
  };

  atualizarBotoesAtivos();

  carregarAgendamentos();

});