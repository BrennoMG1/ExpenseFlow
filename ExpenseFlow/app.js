/* =====================================================
   ExpenseFlow 2.0  —  Frontend Logic
   ===================================================== */

const API_BASE      = "";
const POLL_INTERVAL = 3000;
const MAX_POLLS     = 100;

// ── Elementos DOM ──────────────────────────────────────
const states = {
  form:       document.getElementById("s-form"),
  processing: document.getElementById("s-processing"),
  success:    document.getElementById("s-success"),
  error:      document.getElementById("s-error"),
};

const contaBtn   = document.getElementById("conta-select-btn");
const contaLabel = document.getElementById("conta-select-label");
const contaList  = document.getElementById("conta-options");
const contaError = document.getElementById("conta-error");

let selectedValue = "__placeholder__";
let selectedText  = "";

const btnStart  = document.getElementById("btn-start");
const btnNew    = document.getElementById("btn-new");
const btnRetry  = document.getElementById("btn-retry");
const procLabel = document.getElementById("proc-label");
const logBox    = document.getElementById("log-box");
const okDesc    = document.getElementById("ok-desc");
const okMeta    = document.getElementById("ok-meta");
const errDesc   = document.getElementById("err-desc");

// ── Dropdown: abrir / fechar ───────────────────────────
contaBtn.addEventListener("click", function (e) {
  e.stopPropagation();
  var isOpen = contaList.classList.contains("open");
  contaBtn.classList.remove("open");
  contaList.classList.remove("open");
  if (!isOpen) {
    contaBtn.classList.add("open");
    contaList.classList.add("open");
  }
});

document.addEventListener("click", function () {
  contaBtn.classList.remove("open");
  contaList.classList.remove("open");
});

// ── Utilitários ────────────────────────────────────────
function showState(name) {
  Object.keys(states).forEach(function (k) {
    states[k].classList.toggle("hidden", k !== name);
  });
}

function addLog(msg, type) {
  var dots = logBox.querySelectorAll(".log-dot.pulse");
  dots.forEach(function (d) { d.classList.remove("pulse"); });
  var entry = document.createElement("div");
  entry.className = "log-entry" + (type ? " " + type : "");
  var dot = document.createElement("span");
  dot.className = "log-dot" + (type ? "" : " pulse");
  var text = document.createElement("span");
  text.textContent = msg;
  entry.appendChild(dot);
  entry.appendChild(text);
  logBox.appendChild(entry);
  logBox.scrollTop = logBox.scrollHeight;
}

function clearLog() { logBox.innerHTML = ""; }

function formatDate(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("pt-BR"); }
  catch (e) { return iso; }
}

function showError(msg) {
  errDesc.textContent = msg;
  showState("error");
}

// ── Carregar contas no dropdown ────────────────────────
async function carregarContas() {
  try {
    var res  = await fetch(API_BASE + "/api/contas");
    var data = await res.json();

    contaList.innerHTML = "";

    data.contas.forEach(function (conta) {
      var li = document.createElement("li");

      // ✅ API retorna "connectionId"; suporta também "value" por compatibilidade
      var connId = (conta.connectionId !== undefined) ? conta.connectionId : (conta.value || "");

      li.className     = "custom-select-opt" + (connId === "" ? " opt-todas" : "");
      li.textContent   = conta.label;
      li.dataset.value = connId;

      li.addEventListener("click", function (e) {
        e.stopPropagation();
        selectedValue = connId;
        selectedText  = conta.label;

        contaLabel.textContent = conta.label;
        contaLabel.classList.remove("placeholder-text");
        contaBtn.classList.remove("open", "invalid");
        contaList.classList.remove("open");
        contaError.textContent = "";

        contaList.querySelectorAll(".custom-select-opt").forEach(function (i) {
          i.classList.toggle("selected", i.dataset.value === connId);
        });
      });

      contaList.appendChild(li);
    });

    selectedValue = "__placeholder__";
    selectedText  = "";
    contaLabel.textContent = "Selecione uma conta...";
    contaLabel.classList.add("placeholder-text");

  } catch (e) {
    contaLabel.textContent = "Erro ao carregar contas";
    console.error("Erro ao carregar contas:", e);
  }
}

// ── Iniciar Processamento ──────────────────────────────
async function iniciar() {
  contaError.textContent = "";
  contaBtn.classList.remove("invalid");

  if (selectedValue === "__placeholder__" || selectedText === "") {
    contaError.textContent = "Selecione uma conta para continuar.";
    contaBtn.classList.add("invalid");
    return;
  }

  btnStart.disabled = true;
  procLabel.textContent = "Processando: " + selectedText;
  clearLog();
  showState("processing");
  addLog("Conectando ao servidor...");

  try {
    var res = await fetch(API_BASE + "/api/processar", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ connection_id: selectedValue }),
    });

    if (!res.ok) {
      var errBody = await res.json().catch(function () { return {}; });
      throw new Error(errBody.detail || "Erro ao iniciar. Código: " + res.status);
    }

    var data = await res.json();
    addLog("Robô iniciado com sucesso!");
    addLog("Job ID: " + data.jobId);
    addLog("Aguardando execução...");
    await pollStatus(data.jobId, selectedText);

  } catch (err) {
    showError(err.message || "Erro desconhecido. Tente novamente.");
  } finally {
    btnStart.disabled = false;
  }
}

// ── Polling de status ──────────────────────────────────
function pollStatus(jobId, label) {
  return new Promise(function (resolve) {
    var attempts = 0, lastState = "", errosSeguidos = 0;

    var timer = setInterval(async function () {
      attempts++;
      if (attempts > MAX_POLLS) {
        clearInterval(timer);
        showError("Tempo limite atingido. Verifique o Orchestrator.");
        resolve(); return;
      }

      try {
        var res = await fetch(API_BASE + "/api/status/" + jobId);
        if (!res.ok) {
          if (++errosSeguidos >= 5) {
            clearInterval(timer);
            showError("Não foi possível verificar o status do job.");
            resolve();
          }
          return;
        }

        errosSeguidos = 0;
        var status = await res.json();

        if (status.state !== lastState) { lastState = status.state; addLog("Status: " + status.state); }
        if (status.stateRaw === "Pending" && attempts % 3 === 0) addLog("Aguardando robô disponível...");
        if (status.stateRaw === "Running" && attempts % 4 === 0) addLog("Robô em execução — capturando e-mails...");

        if (status.isFinished) {
          clearInterval(timer);
          if (status.isSuccess) {
            addLog("Concluído com sucesso!", "ok");
            setTimeout(function () { showSuccess(label, status); }, 600);
          } else {
            var motivo = status.info || "Verifique os logs no Orchestrator.";
            addLog("Erro: " + motivo, "err");
            setTimeout(function () { showError("Erro no robô: " + motivo); }, 600);
          }
          resolve();
        }
      } catch (e) {
        errosSeguidos++;
        addLog("Falha de conexão — tentando novamente...");
      }
    }, POLL_INTERVAL);
  });
}

// ── Sucesso ────────────────────────────────────────────
async function showSuccess(label, status) {
  okDesc.textContent = "Transações capturadas de: " + label + ".";
  okMeta.innerHTML =
    "<strong>Conta:</strong> "  + label                        + "<br>" +
    "<strong>Início:</strong> " + formatDate(status.startTime) + "<br>" +
    "<strong>Fim:</strong> "    + formatDate(status.endTime)   + "<br>" +
    "<strong>Job ID:</strong> " + status.jobId;
  showState("success");
  setTimeout(async function () { await carregarTabela(); }, 1000);
}

// ── Tabela ─────────────────────────────────────────────
async function carregarTabela() {
  try {
    var res = await fetch(API_BASE + "/api/dados");
    if (!res.ok) return;
    var data = await res.json();

    if (!data.rows || data.rows.length === 0) {
      document.getElementById("tabela-total").textContent = "Nenhuma transação encontrada.";
      document.getElementById("tabela-wrap").classList.remove("hidden");
      return;
    }

    var thead = document.getElementById("tabela-head");
    var trHead = document.createElement("tr");
    data.headers.forEach(function (h) {
      var th = document.createElement("th"); th.textContent = h; trHead.appendChild(th);
    });
    thead.innerHTML = ""; thead.appendChild(trHead);

    var tbody = document.getElementById("tabela-body");
    tbody.innerHTML = "";
    data.rows.forEach(function (row) {
      var tr = document.createElement("tr");
      row.forEach(function (cell) {
        var td = document.createElement("td"); td.textContent = cell; tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    document.getElementById("tabela-total").textContent = data.total + " transação(ões) registrada(s)";
    document.getElementById("tabela-wrap").classList.remove("hidden");
  } catch (e) {}
}

// ── Botões ─────────────────────────────────────────────
btnStart.addEventListener("click", iniciar);

btnNew.addEventListener("click", function () {
  contaError.textContent = "";
  contaBtn.classList.remove("invalid");
  selectedValue = "__placeholder__";
  selectedText  = "";
  contaLabel.textContent = "Selecione uma conta...";
  contaLabel.classList.add("placeholder-text");
  contaList.querySelectorAll(".custom-select-opt").forEach(function (i) {
    i.classList.remove("selected");
  });
  okMeta.innerHTML = ""; okDesc.textContent = "";
  var tw = document.getElementById("tabela-wrap");
  if (tw) tw.classList.add("hidden");
  showState("form");
});

btnRetry.addEventListener("click", function () {
  errDesc.textContent = "";
  showState("form");
});

// ── Init ───────────────────────────────────────────────
carregarContas();
