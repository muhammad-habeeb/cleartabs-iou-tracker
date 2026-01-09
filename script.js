(() => {
  const nameInput = document.getElementById("name");
  const typeSelect = document.getElementById("type");
  const amountInput = document.getElementById("amount");
  const listEl = document.getElementById("list");
  const detailEl = document.getElementById("detail");
  const searchInput = document.getElementById("search");
  const addBtn = document.getElementById("addBtn");

  const STORAGE_KEY = "cleartabs_v2";
  let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  let activePerson = null;

  const save = () =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  const netAmount = txs =>
    txs.reduce((sum, t) => sum + (t.type === "lent" ? t.amount : -t.amount), 0);

  const validate = (name, amount) => {
    if (!name || amount <= 0) {
      alert("Enter valid name and amount");
      return false;
    }
    return true;
  };

  const addTransaction = () => {
    const name = nameInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeSelect.value;

    if (!validate(name, amount)) return;

    data[name] = data[name] || [];
    data[name].push({ type, amount, date: new Date().toISOString() });

    nameInput.value = "";
    amountInput.value = "";
    save();
    renderList();
  };

  const renderList = () => {
    const q = searchInput.value.toLowerCase();
    listEl.innerHTML = "";

    const people = Object.keys(data).filter(p =>
      p.toLowerCase().includes(q)
    );

    if (people.length === 0) {
      listEl.innerHTML = `<div class="small">No records found</div>`;
      return;
    }

    people.forEach(person => {
      const balance = netAmount(data[person]);
      let label = "All clear", cls = "neutral";

      if (balance > 0) {
        label = `owes you ₹${balance}`;
        cls = "owed";
      } else if (balance < 0) {
        label = `you owe ₹${-balance}`;
        cls = "owe";
      }

      const div = document.createElement("div");
      div.className = "person";
      div.innerHTML = `
        <div class="row">
          <strong>${person}</strong>
          <span class="${cls}">${label}</span>
        </div>
        <div class="small">${data[person].length} transactions</div>
      `;
      div.onclick = () => openDetail(person);
      listEl.appendChild(div);
    });
  };

  const openDetail = person => {
    activePerson = person;
    detailEl.classList.remove("hidden");
    detailEl.innerHTML = `<h3>${person}</h3>
      <div class="small">Net: ₹${netAmount(data[person])}</div>`;

    data[person].forEach((t, i) => {
      const tx = document.createElement("div");
      tx.className = "tx";
      tx.innerHTML = `
        ${t.type === "lent" ? "You lent" : "You borrowed"} ₹${t.amount}
        <div class="small">${new Date(t.date).toLocaleDateString()}</div>
        <button class="secondary">Delete</button>
      `;
      tx.querySelector("button").onclick = () => {
        data[person].splice(i, 1);
        if (!data[person].length) delete data[person];
        save();
        renderList();
        openDetail(person);
      };
      detailEl.appendChild(tx);
    });

    const settleBtn = document.createElement("button");
    settleBtn.textContent = "Mark as settled";
    settleBtn.onclick = () => {
      delete data[person];
      save();
      detailEl.classList.add("hidden");
      renderList();
    };

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.className = "secondary";
    closeBtn.onclick = () => detailEl.classList.add("hidden");

    detailEl.append(settleBtn, closeBtn);
  };

  addBtn.onclick = addTransaction;
  document.addEventListener("keydown", e => e.key === "Enter" && addTransaction());
  searchInput.oninput = renderList;

  renderList();
})();