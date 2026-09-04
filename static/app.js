let globalData = [];
let selectedTask = null;
let selectedEngineerName = null;
let currentArchiveFilter = 'all';

document.addEventListener("DOMContentLoaded", () => {
    fetchData();
});

function fetchData() {
    fetch('/api/data')
        .then(response => response.json())
        .then(data => {
            globalData = data.knowledge_base || [];
            
            const savedTab = localStorage.getItem('activeTab') || 'maddelerim';
            switchTab(savedTab);
        })
        .catch(error => console.error('Veri çekme hatası:', error));
}

function switchTab(tab) {
    localStorage.setItem('activeTab', tab);

    document.getElementById('sec-maddelerim').style.display = 'none';
    document.getElementById('sec-arsiv').style.display = 'none';
    document.getElementById('sec-muhendisler').style.display = 'none';
    
    document.getElementById('btn-maddelerim').classList.remove('active');
    document.getElementById('btn-arsiv').classList.remove('active');
    document.getElementById('btn-muhendisler').classList.remove('active');

    if (tab === 'maddelerim') {
        document.getElementById('sec-maddelerim').style.display = 'block';
        document.getElementById('btn-maddelerim').classList.add('active');
        renderTasks(globalData);
    } else if (tab === 'arsiv') {
        document.getElementById('sec-arsiv').style.display = 'block';
        document.getElementById('btn-arsiv').classList.add('active');
        
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        currentArchiveFilter = 'all';
        
        document.querySelectorAll('.filter-badge').forEach((b, index) => {
            if (index === 0) {
                b.style.background = 'var(--man-dark)';
                b.style.color = 'white';
            } else {
                b.style.background = '#e9ecef';
                b.style.color = '#495057';
            }
        });

        renderArchive(globalData);
        
    } else if (tab === 'muhendisler') {
        document.getElementById('sec-muhendisler').style.display = 'block';
        document.getElementById('btn-muhendisler').classList.add('active');
        renderEngineers(globalData);
    }
}

function renderTasks(data) {
    const taskList = document.getElementById('task-sidebar');
    const initialGrid = document.getElementById('initial-task-grid');
    if (!taskList || !initialGrid) return;

    taskList.innerHTML = "";
    initialGrid.innerHTML = "";

    const myTasks = data.filter(item => item.tamamlayanMühendis && item.tamamlayanMühendis.trim() === "Begüm Miray Özalp");

    if (!myTasks || myTasks.length === 0) {
        initialGrid.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; grid-column: 1/-1;">Size atanmış madde bulunmuyor.</p>`;
        return;
    }

    myTasks.sort((a, b) => {
        const isAActive = a.durum && (a.durum.includes("Çözülüyor") || a.durum.includes("Destek") || a.durum.includes("Devredildi"));
        const isBActive = b.durum && (b.durum.includes("Çözülüyor") || b.durum.includes("Destek") || b.durum.includes("Devredildi"));
        if (isAActive && !isBActive) return -1;
        if (!isAActive && isBActive) return 1;
        return new Date(b.tarih || 0) - new Date(a.tarih || 0);
    });

    myTasks.forEach(task => {
        const isCompleted = task.durum && task.durum.includes('Sonuçlandırıldı');
        const bgStyle = isCompleted ? 'background: #f8f9fa; border-left: 4px solid #6c757d;' : 'background: #e8f5e9; border-left: 4px solid #2e7d32;';
        
        const sidebarItem = document.createElement('div');
        sidebarItem.className = 'task-item';
        sidebarItem.style.cssText = `padding: 10px 12px; margin-bottom: 6px; border-radius: 6px; cursor: pointer; border: 1px solid #ddd; ${bgStyle}; font-size:12px;`;
        sidebarItem.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <b>${task.id || 'TASK'}</b>
                <span style="font-size: 9px; font-weight: bold; padding: 2px 4px; border-radius: 3px; background: ${isCompleted ? '#e2e0e0' : '#c8e6c9'}; color: ${isCompleted ? '#333' : '#1b5e20'};">${task.durum || 'Çözülüyor'}</span>
            </div>
            <div style="color: #444; margin-top: 2px;">${task.kategori}</div>
        `;
        sidebarItem.onclick = () => selectTask(task);
        taskList.appendChild(sidebarItem);

        const gridCard = document.createElement('div');
        gridCard.style.cssText = `background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 15px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.03); transition: transform 0.1s; ${bgStyle};`;
        gridCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <b style="font-size: 13px; color: #111;">${task.id}</b>
                <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: ${isCompleted ? '#e2e0e0' : '#c8e6c9'}; color: ${isCompleted ? '#333' : '#1b5e20'};">${task.durum || 'Çözülüyor'}</span>
            </div>
            <h4 style="font-size: 13px; color: #333; margin-bottom: 6px; font-weight: 600;">${task.kategori}</h4>
            <small style="color: #666; display: block;">Araç ID: ${task.aracId} | Parça: ${task.parcaNo}</small>
        `;
        gridCard.onmouseover = () => gridCard.style.transform = 'translateY(-2px)';
        gridCard.onmouseout = () => gridCard.style.transform = 'translateY(0)';
        gridCard.onclick = () => selectTask(task);
        initialGrid.appendChild(gridCard);
    });
}

function selectTask(task) {
    selectedTask = task;
    
    document.getElementById('task-sidebar').style.display = 'block';
    const detailPane = document.getElementById('task-detail-container');
    detailPane.classList.remove('full-width-pane');
    
    document.getElementById('initial-task-grid').style.display = 'none';
    document.getElementById('karne-form-wrapper').style.display = 'block';
    
    setTaskFormReadOnly(false);
    
    document.getElementById('karne-id').value = task.id || '';
    document.getElementById('karne-kategori').value = task.kategori || '';
    document.getElementById('karne-arac-parca').value = `Araç: ${task.aracId} | Parça: ${task.parcaNo}`;
    document.getElementById('karne-muhendis').value = task.tamamlayanMühendis || '';
    document.getElementById('karne-hatakaynagi').value = task.hataKaynagi || '';
    document.getElementById('karne-cozum').value = '';

    renderRelatedTasks(task, globalData);
    detailPane.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function loadRelatedTaskDetail(taskId) {
    const targetTask = globalData.find(t => t.id === taskId);
    if (!targetTask) return;

    setTaskFormReadOnly(true);

    document.getElementById('karne-id').value = targetTask.id;
    document.getElementById('karne-kategori').value = targetTask.kategori;
    document.getElementById('karne-arac-parca').value = `Araç: ${targetTask.aracId} | Parça: ${targetTask.parcaNo}`;
    document.getElementById('karne-muhendis').value = targetTask.tamamlayanMühendis;
    document.getElementById('karne-hatakaynagi').value = targetTask.hataKaynagi || '';
    
    const cozumVal = targetTask.cozum;
    document.getElementById('karne-cozum').value = (!cozumVal || cozumVal === 'Belirtilmemiş') ? '' : cozumVal;
}

function setTaskFormReadOnly(isReadOnly) {
    const actionButtons = document.querySelector('.action-buttons');
    const secondaryActions = document.querySelector('.secondary-actions');
    const cozumTextArea = document.getElementById('karne-cozum');
    const kategoriInput = document.getElementById('karne-kategori');

    if (actionButtons) actionButtons.style.display = isReadOnly ? 'none' : 'flex';
    if (secondaryActions) secondaryActions.style.display = isReadOnly ? 'none' : 'flex';
    
    if (cozumTextArea) cozumTextArea.readOnly = isReadOnly;
    if (kategoriInput) kategoriInput.readOnly = isReadOnly;
}

function renderRelatedTasks(currentTask, data) {
    const container = document.getElementById('related-tasks-container');
    if (!container) return;
    
    const relatedTasks = data.filter(t => 
        t.parcaNo === currentTask.parcaNo && 
        t.id !== currentTask.id && 
        (t.durum && (t.durum.includes('Sonuçlandırıldı') || t.durum.includes('Reddedildi')))
    );
    
    let html = `<h4 style="font-size: 13px; color: #333; margin-bottom: 10px; font-weight: 700;">🔗 Benzer Geçmiş ve Sonuçlanmış Maddeler (${relatedTasks.length})</h4>`;

    if (relatedTasks.length === 0) {
        html += `<p style="font-size: 12px; color: var(--text-muted);">Bu parça numarasına (` + currentTask.parcaNo + `) ait sonuçlanmış/reddedilmiş başka geçmiş kayıt bulunmuyor.</p>`;
    } else {
        html += `<div style="max-height: 180px; overflow-y: auto; padding-right: 5px;">`;
        relatedTasks.forEach(t => {
            html += `
                <div class="related-task-card" onclick="loadRelatedTaskDetail('${t.id}')">
                    <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 12px;">
                        <span>${t.id} - ${t.kategori}</span>
                        <span style="color: var(--text-muted);">${t.durum}</span>
                    </div>
                    <div style="font-size: 11px; color: #555; margin-top: 3px;">
                        <b>Mühendis:</b> ${t.tamamlayanMühendis} | <b>Çözüm:</b> ${t.cozum ? t.cozum.substring(0, 70) + '...' : 'Belirtilmemiş'}
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    container.innerHTML = html;
}

function cancelKarne() {
    document.getElementById('task-sidebar').style.display = 'none';
    const detailPane = document.getElementById('task-detail-container');
    detailPane.classList.add('full-width-pane');
    
    document.getElementById('initial-task-grid').style.display = 'grid';
    document.getElementById('karne-form-wrapper').style.display = 'none';
    selectedTask = null;
}

function submitKarne(event) {
    event.preventDefault();
    
    const taskData = {
        id: document.getElementById('karne-id').value,
        kategori: document.getElementById('karne-kategori').value,
        aracId: document.getElementById('karne-arac-parca').value.split('|')[0].replace('Araç:', '').trim(),
        parcaNo: document.getElementById('karne-arac-parca').value.split('|')[1].replace('Parça:', '').trim(),
        hataKaynagi: document.getElementById('karne-hatakaynagi').value,
        tamamlayanMühendis: document.getElementById('karne-muhendis').value,
        cozum: document.getElementById('karne-cozum').value,
        tarih: new Date().toLocaleDateString('tr-TR'),
        durum: "Sonuçlandırıldı ✔"
    };

    fetch('/api/save-karne', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            showToast("Madde başarıyla sonuçlandırıldı ve arşive eklendi!", "success");
            fetchData();
            cancelKarne();
        } else {
            showToast("İşlem sırasında bir hata oluştu.", "error");
        }
    })
    .catch(err => console.error('Hata:', err));
}

function rejectTask() {
    if (!selectedTask) return;
    
    const cozumMetni = document.getElementById('karne-cozum').value.trim();
    if (!cozumMetni) {
        showToast("Lütfen reddetme gerekçesini çözüm/reçete alanına yazın!", "error");
        document.getElementById('karne-cozum').focus();
        return;
    }

    const taskData = {
        id: selectedTask.id,
        kategori: selectedTask.kategori,
        aracId: selectedTask.aracId,
        parcaNo: selectedTask.parcaNo,
        hataKaynagi: selectedTask.hataKaynagi,
        tamamlayanMühendis: document.getElementById('karne-muhendis').value,
        cozum: cozumMetni,
        tarih: new Date().toLocaleDateString('tr-TR'),
        durum: "Reddedildi ❌"
    };

    fetch('/api/save-karne', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
    })
    .then(res => res.json())
    .then(data => {
        showToast("Madde reddedildi ve arşive işlendi.", "error");
        fetchData();
        cancelKarne();
    });
}

function requestSupport() {
    if (!selectedTask) return;

    fetch('/api/request-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTask.id })
    })
    .then(res => res.json())
    .then(data => {
        showToast("Destek talebi ilgili ekibe başarıyla iletildi!", "info");
        fetchData();
        cancelKarne();
    });
}

function setArchiveFilter(status, btnElement) {
    currentArchiveFilter = status;
    
    document.querySelectorAll('.filter-badge').forEach(b => {
        b.style.background = '#e9ecef';
        b.style.color = '#495057';
    });
    btnElement.style.background = 'var(--man-dark)';
    btnElement.style.color = 'white';

    filterArchive();
}

function filterArchive() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    
    const filtered = globalData.filter(item => {
        const matchesQuery = (
            (item.id && item.id.toLowerCase().includes(query)) ||
            (item.aracId && item.aracId.toLowerCase().includes(query)) ||
            (item.parcaNo && item.parcaNo.toLowerCase().includes(query)) ||
            (item.kategori && item.kategori.toLowerCase().includes(query)) ||
            (item.hataKaynagi && item.hataKaynagi.toLowerCase().includes(query)) ||
            (item.tamamlayanMühendis && item.tamamlayanMühendis.toLowerCase().includes(query)) ||
            (item.cozum && item.cozum.toLowerCase().includes(query))
        );

        let matchesStatus = true;
        if (currentArchiveFilter !== 'all') {
            matchesStatus = item.durum && item.durum.includes(currentArchiveFilter);
        }

        return matchesQuery && matchesStatus;
    });

    renderArchive(filtered);
}

function renderArchive(data) {
    const archiveGrid = document.getElementById('archive-grid');
    const sidebar = document.getElementById('archive-sidebar');
    if (!archiveGrid || !sidebar) return;

    archiveGrid.innerHTML = "";
    sidebar.innerHTML = "";
    
    if (!data || data.length === 0) {
        archiveGrid.innerHTML = `<p style="color:var(--text-muted); padding:10px; font-size:13px; grid-column:1/-1;">Arşivde kayıtlı madde bulunamadı.</p>`;
        sidebar.innerHTML = `<p style="color:var(--text-muted); padding:10px; font-size:12px;">Kayıt bulunamadı.</p>`;
        return;
    }

    let sortedData = [...data];
    const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

    if (!query && currentArchiveFilter === 'all') {
        sortedData.sort((a, b) => {
            const isAActive = a.durum && (a.durum.includes("Çözülüyor") || a.durum.includes("Destek") || a.durum.includes("Devredildi"));
            const isBActive = b.durum && (b.durum.includes("Çözülüyor") || b.durum.includes("Destek") || b.durum.includes("Devredildi"));
            if (isAActive && !isBActive) return -1;
            if (!isAActive && isBActive) return 1;
            return 0;
        });
    }

    sortedData.forEach(item => {
        let durum = item.durum || 'Sonuçlandırıldı';
        let badgeStyle = "background:#d4edda; color:#155724;";

        if (durum.includes("Çözülüyor") || durum.includes("Destek")) {
            badgeStyle = "background:#fff3cd; color:#856404;";
        } else if (durum.includes("Reddedildi")) {
            badgeStyle = "background:#f8d7da; color:#721c24;";
        } else if (durum.includes("Devredildi")) {
            badgeStyle = "background:#cce5ff; color:#004085;";
        }

        const div = document.createElement('div');
        div.className = "related-task-card";
        div.onclick = () => showArchiveTaskDetail(item);
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 12px;">
                <span><b>${item.id}</b> - ${item.kategori}</span>
                <span style="${badgeStyle} padding: 1px 5px; border-radius: 3px; font-size: 10px;">${durum}</span>
            </div>
            <div style="font-size: 11px; color: #555; margin-top: 3px;">
                <b>Araç:</b> ${item.aracId} | <b>Parça:</b> ${item.parcaNo} | <b>Mühendis:</b> ${item.tamamlayanMühendis}
            </div>
        `;
        sidebar.appendChild(div);

        const card = document.createElement('div');
        card.style.cssText = `background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 15px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.03);`;
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <b style="font-size: 13px; color: #111;">${item.id}</b>
                <span style="${badgeStyle} padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">${durum}</span>
            </div>
            <h4 style="font-size: 13px; color: #333; margin-bottom: 6px; font-weight: 600;">${item.kategori}</h4>
            <small style="color: #666; display: block;">Araç ID: ${item.aracId} | Mühendis: ${item.tamamlayanMühendis}</small>
        `;
        card.onclick = () => showArchiveTaskDetail(item);
        archiveGrid.appendChild(card);
    });
}

function showArchiveTaskDetail(item) {
    document.getElementById('archive-sidebar').style.display = 'block';
    const detailPane = document.getElementById('archive-detail-pane');
    detailPane.classList.remove('full-width-pane');
    
    document.getElementById('archive-grid').style.display = 'none';
    document.getElementById('archive-detail-content').style.display = 'block';

    const content = document.getElementById('archive-detail-content');
    content.innerHTML = `
        <div style="background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f4f6f9; padding-bottom: 12px; margin-bottom: 15px;">
                <h3 style="color: #333; margin: 0; font-size: 16px;">📂 Madde Detay Kartı: ${item.id}</h3>
                <span style="font-size: 12px; background: #e2e0e0; padding: 4px 10px; border-radius: 12px; font-weight: bold;">${item.durum || 'Sonuçlandırıldı'}</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 13px; margin-bottom: 20px;">
                <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;"><b>Kategori:</b><br>${item.kategori}</div>
                <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;"><b>Tarih:</b><br>${item.tarih || '-'}</div>
                <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;"><b>Araç ID & Parça No:</b><br>Araç: ${item.aracId} | Parça: ${item.parcaNo}</div>
                <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;"><b>Sorumlu Mühendis:</b><br>👩‍💻 ${item.tamamlayanMühendis}</div>
                <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; grid-column: 1/-1;"><b>Hata Kaynağı:</b><br>${item.hataKaynagi}</div>
            </div>

            <div style="background: #fdfdfd; border: 1px solid #e0e0e0; padding: 15px; border-radius: 6px;">
                <b style="font-size: 13px; color: #333; display: block; margin-bottom: 5px;">📝 Çözüm / Reçete Detayı:</b>
                <p style="font-size: 13px; color: #444; line-height: 1.5; margin: 0;">${item.cozum || 'Detay girilmemiş.'}</p>
            </div>
        </div>
    `;
    detailPane.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderEngineers(data) {
    const sidebar = document.getElementById('engineer-sidebar');
    if (!sidebar) return;
    sidebar.innerHTML = "";

    if (!data || data.length === 0) {
        sidebar.innerHTML = "<p style='color:var(--text-muted); font-size:13px;'>Kayıt bulunamadı.</p>";
        return;
    }

    const grouped = {};
    data.forEach(item => {
        const eng = item.tamamlayanMühendis || "Bilinmiyor";
        if (!grouped[eng]) grouped[eng] = [];
        grouped[eng].push(item);
    });

    const engineerNames = Object.keys(grouped);
    if (!selectedEngineerName || !grouped[selectedEngineerName]) {
        selectedEngineerName = engineerNames[0];
    }

    engineerNames.forEach(eng => {
        const count = grouped[eng].length;
        const isActive = eng === selectedEngineerName ? 'background: var(--man-red); color: white; border-color: var(--man-red);' : 'background: #f8f9fa; color: #333;';
        
        const btn = document.createElement('div');
        btn.style.cssText = `padding: 12px 15px; margin-bottom: 8px; border-radius: 6px; cursor: pointer; border: 1px solid #ccc; font-weight: bold; font-size: 13px; display: flex; justify-content: space-between; align-items: center; transition: 0.2s; ${isActive}`;
        btn.innerHTML = `<span>👩‍💻 ${eng}</span> <span style="font-size:11px; padding: 2px 6px; border-radius: 10px; background: rgba(0,0,0,0.1);">${count} Madde</span>`;
        
        btn.onclick = () => {
            selectedEngineerName = eng;
            renderEngineers(data);
        };
        sidebar.appendChild(btn);
    });

    renderEngineerDetail(selectedEngineerName, grouped[selectedEngineerName]);
}

function renderEngineerDetail(engineerName, data) {
    const detailView = document.getElementById('engineer-detail-view');
    const engTasks = data.filter(t => t.tamamlayanMühendis === engineerName);
    
    const total = engTasks.length;
    const completed = engTasks.filter(t => t.durum && t.durum.includes('Sonuçlandırıldı')).length;
    const rejected = engTasks.filter(t => t.durum && t.durum.includes('Reddedildi')).length;
    const inProgress = engTasks.filter(t => t.durum && t.durum.includes('Çözülüyor')).length;
    
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    let html = `
        <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 8px; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--bg-color); padding-bottom: 12px; margin-bottom: 20px;">
                <h3 style="color: var(--man-dark); margin: 0; font-size: 16px;">👨‍💻 Uzman Mühendis: ${engineerName}</h3>
                <span style="font-size: 12px; background: rgba(226,0,26,0.1); color: var(--man-red); padding: 4px 10px; border-radius: 12px; font-weight: bold;">Aktif Görevli</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
                <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; text-align: center; border: 1px solid #e9ecef;">
                    <span style="font-size: 11px; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: 600;">Toplam İş</span>
                    <strong style="font-size: 18px; color: var(--text-main);">${total}</strong>
                </div>
                <div style="background: #e8f5e9; padding: 12px; border-radius: 6px; text-align: center; border: 1px solid #c8e6c9;">
                    <span style="font-size: 11px; color: #2e7d32; display: block; text-transform: uppercase; font-weight: 600;">Sonuçlanan</span>
                    <strong style="font-size: 18px; color: #2e7d32;">${completed}</strong>
                </div>
                <div style="background: #ffebee; padding: 12px; border-radius: 6px; text-align: center; border: 1px solid #ffcdd2;">
                    <span style="font-size: 11px; color: #c62828; display: block; text-transform: uppercase; font-weight: 600;">Reddedilen</span>
                    <strong style="font-size: 18px; color: #c62828;">${rejected}</strong>
                </div>
                <div style="background: #e1f5fe; padding: 12px; border-radius: 6px; text-align: center; border: 1px solid #b3e5fc;">
                    <span style="font-size: 11px; color: #0277bd; display: block; text-transform: uppercase; font-weight: 600;">Çözülüyor</span>
                    <strong style="font-size: 18px; color: #0277bd;">${inProgress}</strong>
                </div>
            </div>

            <div style="margin-bottom: 25px; background: #f8f9fa; padding: 15px; border-radius: 6px; border: 1px solid #e9ecef;">
                <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 8px;">
                    <span>Başarı / Tamamlanma Oranı</span>
                    <span style="color: var(--man-red);">${successRate}%</span>
                </div>
                <div style="width: 100%; background: #e0e0e0; height: 10px; border-radius: 5px; overflow: hidden;">
                    <div style="width: ${successRate}%; background: var(--man-red); height: 100%; transition: width 0.4s ease;"></div>
                </div>
            </div>

            <h4 style="font-size: 13px; color: var(--man-dark); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Atanmış Görev Geçmişi</h4>
    `;

    if (engTasks.length === 0) {
        html += `<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px;">Bu mühendis üzerine atanmış herhangi bir kayıt bulunmuyor.</p>`;
    } else {
        html += `<div style="display: flex; flex-direction: column; gap: 10px; max-height: 350px; overflow-y: auto;">`;
        engTasks.forEach(t => {
            let badgeBg = '#e0e0e0';
            if (t.durum && t.durum.includes('Sonuçlandırıldı')) badgeBg = '#2e7d32';
            else if (t.durum && t.durum.includes('Reddedildi')) badgeBg = '#c62828';
            else if (t.durum && t.durum.includes('Çözülüyor')) badgeBg = '#0277bd';

            html += `
                <div style="background: #f8f9fa; border: 1px solid var(--border-color); padding: 12px; border-radius: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <b style="font-size: 13px; color: var(--man-dark);">${t.id} - ${t.kategori}</b>
                        <span style="font-size: 11px; background: ${badgeBg}; color: white; padding: 2px 8px; border-radius: 10px; font-weight: bold;">${t.durum || 'Aktif'}</span>
                    </div>
                    <div style="font-size: 12px; color: var(--text-muted); display: flex; gap: 15px;">
                        <span>🚗 Araç: <b>${t.aracId}</b></span>
                        <span>⚙ Parça: <b>${t.parcaNo}</b></span>
                        <span>📅 Tarih: <b>${t.tarih || '-'}</b></span>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `</div>`;
    detailView.innerHTML = html;
}

function fetchDataAndRefresh() {
    fetch('/api/data')
        .then(response => response.json())
        .then(data => {
            globalData = data.knowledge_base || [];
            renderTasks(globalData);
            
            const muhendisSec = document.getElementById('sec-muhendisler');
            if (muhendisSec && muhendisSec.style.display === 'block') {
                renderEngineers(globalData);
            }
            
            const arsivSec = document.getElementById('sec-arsiv');
            if (arsivSec && arsivSec.style.display === 'block') {
                filterArchive();
            }
        });
}

function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '✔';
    if (type === 'error') icon = '❌';
    if (type === 'info') icon = 'ℹ';

    toast.innerHTML = `<span style="font-size: 16px;">${icon}</span> <span>${message}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function transferTaskModal() {
    if (!selectedTask) return;
    document.getElementById('transfer-modal').style.display = 'flex';
}

function closeTransferModal() {
    document.getElementById('transfer-modal').style.display = 'none';
}

function confirmTransfer() {
    const selectBox = document.getElementById('modal-muhendis-select');
    const yeniMuhendis = selectBox.value;

    if (!yeniMuhendis) {
        showToast("Lütfen listeden bir mühendis seçin!", "error");
        return;
    }

    fetch('/api/transfer-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTask.id, yeniMuhendis: yeniMuhendis })
    })
    .then(res => res.json())
    .then(data => {
        closeTransferModal();
        showToast(`Madde başarıyla ${yeniMuhendis} adlı mühendise aktarıldı!`, "success");
        fetchData();
        cancelKarne();
    });
}