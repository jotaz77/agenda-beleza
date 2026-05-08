document.addEventListener("DOMContentLoaded", async () => {

  const supabase = window.supabase.createClient(
    "https://bjaurtrqrasznuptthyf.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqYXVydHJxcmFzem51cHR0aHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDkwNTIsImV4cCI6MjA5MzQ4NTA1Mn0.iCQyvzAJykzgLO4kZkJZ8qNbv3549rG_JuwcVEZDrKA"
  );

  // 🔐 USUÁRIO LOGADO (cliente)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    alert("Você precisa estar logado!");
    return;
  }

  // 📌 PEGAR STUDIO DA URL (ESSENCIAL AGORA)
  const params = new URLSearchParams(window.location.search);
  const studioUsername = params.get("studio");

  if (!studioUsername) {
    alert("Studio inválido");
    return;
  }

  // 🔍 BUSCAR DONO DO STUDIO
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, capacity, slot_interval")
    .eq("username", studioUsername)
    .single();

  if (profileError || !profile) {
    console.log(profileError);
    alert("Studio não encontrado");
    return;
  }

  const ownerId = profile.id;

  // ⏰ HORÁRIOS BASE (por enquanto fixo)
  const horariosBase = [
    "09:00", "10:00", "11:00",
    "13:00", "14:00", "15:00",
    "16:00", "17:00"
  ];

  const timesDiv = document.getElementById("times");
  let horarioSelecionado = null;

  // 🔍 BUSCAR OCUPADOS (CORRETO AGORA)
  async function buscarHorariosOcupados(date) {

    const { data, error } = await supabase
      .from("appointments")
      .select("time")
      .eq("date", date)
      .eq("owner_id", ownerId); // 🔥 AGORA CERTO

    if (error) {
      console.log(error);
      return [];
    }

    return data.map(i => i.time);
  }

  // 🎯 RENDER HORÁRIOS
  async function renderHorarios() {

    const date = document.getElementById("date").value;

    timesDiv.innerHTML = "";

    if (!date) {
      timesDiv.innerHTML = "<p class='text-gray-400'>Escolha uma data</p>";
      return;
    }

    const ocupados = await buscarHorariosOcupados(date);

    horariosBase.forEach(h => {

      const btn = document.createElement("button");
      btn.innerText = h;

      if (ocupados.includes(h)) {

        btn.className = "bg-gray-300 p-2 rounded opacity-50";
        btn.disabled = true;

      } else {

        btn.className = "bg-pink-100 p-2 rounded";

        btn.onclick = () => {

          horarioSelecionado = h;

          document.querySelectorAll("#times button")
            .forEach(b => b.classList.remove("bg-pink-500", "text-white"));

          btn.classList.add("bg-pink-500", "text-white");
        };
      }

      timesDiv.appendChild(btn);
    });
  }

  // 📅 CHANGE DATE
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

          // 🔥 CORRETO AGORA
          owner_id: ownerId,
          client_id: user.id,

          status: "booked"
        }
      ]);

    if (error) {
      console.log(error);
      alert("Erro ao salvar");
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

    document.getElementById("name").value = "";
    document.getElementById("phone").value = "";
    horarioSelecionado = null;

    renderHorarios();
  };

});
