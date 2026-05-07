document.addEventListener("DOMContentLoaded", async () => {

  // 🔗 SUPABASE
  const supabaseUrl = "https://bjaurtrqrasznuptthyf.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqYXVydHJxcmFzem51cHR0aHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDkwNTIsImV4cCI6MjA5MzQ4NTA1Mn0.iCQyvzAJykzgLO4kZkJZ8qNbv3549rG_JuwcVEZDrKA";

  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

  // 🔐 PEGAR USUÁRIO LOGADO
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Você precisa estar logado!");
    return;
  }

  // ⏰ HORÁRIOS BASE
  const horariosBase = [
    "09:00", "10:00", "11:00",
    "13:00", "14:00", "15:00",
    "16:00", "17:00"
  ];

  const timesDiv = document.getElementById("times");
  let horarioSelecionado = null;

  // 🔍 BUSCAR HORÁRIOS OCUPADOS (AGORA POR USER)
  async function buscarHorariosOcupados(dataSelecionada) {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("time")
        .eq("date", dataSelecionada)
        .eq("user_id", user.id); // 🔥 só do próprio usuário

      if (error) {
        console.log("Erro Supabase:", error);
        return [];
      }

      return data.map(item => item.time);
    } catch (err) {
      console.log("Erro geral:", err);
      return [];
    }
  }

  // 🎯 RENDERIZAR HORÁRIOS
  async function renderHorarios() {
    const date = document.getElementById("date").value;

    timesDiv.innerHTML = "";

    if (!date) {
      timesDiv.innerHTML = "<p class='text-gray-400'>Escolha uma data</p>";
      return;
    }

    let ocupados = [];

    try {
      ocupados = await buscarHorariosOcupados(date);
    } catch (e) {
      console.log("Erro ao carregar horários:", e);
    }

    horariosBase.forEach(h => {
      const btn = document.createElement("button");
      btn.innerText = h;

      if (ocupados.includes(h)) {
        btn.className = "bg-gray-300 p-2 rounded opacity-50";
        btn.disabled = true;
      } else {
        btn.className = "bg-gray-100 p-2 rounded";

        btn.onclick = () => {
          horarioSelecionado = h;

          document.querySelectorAll("#times button")
            .forEach(b => b.classList.remove("bg-pink-400", "text-white"));

          btn.classList.add("bg-pink-400", "text-white");
        };
      }

      timesDiv.appendChild(btn);
    });
  }

  // 🔁 QUANDO MUDAR DATA
  document.getElementById("date").addEventListener("change", () => {
    horarioSelecionado = null;
    renderHorarios();
  });

  // 🚀 AGENDAR
  window.agendar = async function () {
    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    const date = document.getElementById("date").value;
    const serviceSelect = document.getElementById("service");
    const serviceText = serviceSelect.options[serviceSelect.selectedIndex].text;

    if (!name || !phone || !date || !horarioSelecionado) {
      alert("Preencha tudo!");
      return;
    }

    const { error } = await supabase
      .from("appointments")
      .insert([
        {
          name,
          phone,
          service: serviceText,
          date,
          time: horarioSelecionado,
          user_id: user.id // 🔥 ESSENCIAL PRO RLS
        }
      ]);

    if (error) {
      console.log("Erro ao salvar:", error);
      alert("Erro ao salvar!");
      return;
    }

    const msg = `Novo agendamento 💅
Nome: ${name}
Serviço: ${serviceText}
Data: ${date}
Hora: ${horarioSelecionado}`;

    const url = `https://wa.me/5581988875043?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");

    alert("Agendado com sucesso!");

    // reset
    document.getElementById("name").value = "";
    document.getElementById("phone").value = "";
    horarioSelecionado = null;
    renderHorarios();
  };

});