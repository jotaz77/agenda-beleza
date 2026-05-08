document.addEventListener("DOMContentLoaded", async () => {

  // 🔗 SUPABASE
  const supabaseUrl =
    "https://bjaurtrqrasznuptthyf.supabase.co";

  const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqYXVydHJxcmFzem51cHR0aHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDkwNTIsImV4cCI6MjA5MzQ4NTA1Mn0.iCQyvzAJykzgLO4kZkJZ8qNbv3549rG_JuwcVEZDrKA";

  const supabase =
    window.supabase.createClient(
      supabaseUrl,
      supabaseKey
    );

  // 📦 ELEMENTOS
  const lista =
    document.getElementById("lista");

  let statusAtual = "booked";

  // 🔐 PEGAR USER
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // 🚫 NÃO LOGADO
  if (!user) {

    window.location.href =
      "login.html";

    return;
  }

  // 👤 PERFIL
  const {
    data: profile,
    error: profileError
  } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {

    console.log(profileError);

  }

  // 🎨 SETAR PERFIL
  if (profile) {

    const studioName =
      document.getElementById("studioName");

    const logo =
      document.getElementById("logo");

    if (studioName) {

      studioName.innerText =
        profile.studio_name || "Meu Studio";
    }

    if (
      logo &&
      profile.logo_url
    ) {

      logo.src =
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

      // ✅ ATIVO
      if (status === statusAtual) {

        btn.classList.remove(
          "bg-white",
          "text-gray-700"
        );

        btn.classList.add(
          "bg-pink-500",
          "text-white",
          "shadow-lg",
          "scale-105"
        );

      } else {

        btn.classList.remove(
          "bg-pink-500",
          "text-white",
          "shadow-lg",
          "scale-105"
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

    lista.innerHTML = `
      <div class="text-center text-gray-500 py-10">
        Carregando...
      </div>
    `;

    // 🔍 QUERY
    let query =
      supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
        .order("date", {
          ascending: true
        })
        .order("time", {
          ascending: true
        });

    // 📌 FILTROS
    if (statusAtual === "booked") {

      query =
        query.or(
          "status.eq.booked,status.is.null"
        );

    } else {

      query =
        query.eq(
          "status",
          statusAtual
        );

    }

    // 🚀 EXECUTAR
    const {
      data,
      error
    } = await query;

    // ❌ ERRO
    if (error) {

      console.log(error);

      lista.innerHTML = `
        <div class="text-center text-red-500 py-10">
          Erro ao carregar
        </div>
      `;

      return;
    }

    // 🚫 VAZIO
    if (!data || data.length === 0) {

      lista.innerHTML = `
        <div class="text-center text-gray-400 py-10">
          Nenhum agendamento
        </div>
      `;

      return;
    }

    // 🔄 LIMPAR
    lista.innerHTML = "";

    // 🎨 RENDER
    data.forEach(item => {

      const div =
        document.createElement("div");

      // 🎨 CORES
      let cor =
        "bg-white border-pink-100";

      if (item.status === "done") {

        cor =
          "bg-green-50 border-green-200";
      }

      if (item.status === "cancelled") {

        cor =
          "bg-red-50 border-red-200";
      }

      div.className =
        `
        p-5
        rounded-3xl
        shadow-md
        border
        ${cor}
        transition
      `;

      div.innerHTML = `

        <div class="flex items-center justify-between">

          <div>

            <h2 class="font-bold text-lg text-gray-800">
              ${item.name}
            </h2>

            <p class="text-gray-600 mt-1">
              💅 ${item.service}
            </p>

            <p class="text-sm text-gray-500 mt-1">
              📅 ${item.date} às ${item.time}
            </p>

          </div>

        </div>

        ${
          item.status === "booked" ||
          item.status === null

            ? `

          <div class="flex gap-2 mt-4">

            <button
              onclick="concluir(${item.id})"
              class="
                flex-1
                bg-green-500
                hover:bg-green-600
                text-white
                py-2
                rounded-2xl
                font-semibold
                transition
              "
            >
              Concluir
            </button>

            <button
              onclick="cancelar(${item.id})"
              class="
                flex-1
                bg-red-500
                hover:bg-red-600
                text-white
                py-2
                rounded-2xl
                font-semibold
                transition
              "
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

    const { error } =
      await supabase
        .from("appointments")
        .update({
          status: "done"
        })
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {

      console.log(error);

      alert("Erro ao concluir");

      return;
    }

    carregarAgendamentos();

  };

  // ❌ CANCELAR
  window.cancelar = async function (id) {

    const { error } =
      await supabase
        .from("appointments")
        .update({
          status: "cancelled"
        })
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {

      console.log(error);

      alert("Erro ao cancelar");

      return;
    }

    carregarAgendamentos();

  };

  // 🚀 INICIAR
  atualizarBotoesAtivos();

  carregarAgendamentos();

});
