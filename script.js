document.addEventListener('DOMContentLoaded', () => {

    // ================= 1. LOCALSTORAGE & ДАННЫЕ =================
    const STORAGE_KEY_USER = 'nb_current_user';
    const STORAGE_KEY_ORDERS = 'nb_orders';

    const defaultOrders = [
        {
            id: 'ORD-101',
            userId: 'client_demo',
            company: 'РК «Арена» (Москва)',
            phone: '+7 (999) 111-22-33',
            lanes: '12',
            equipment: 'Brunswick GS-Series',
            task: 'Периодический сбой шароподъемника на 4-й дорожке в вечернее время',
            status: 'new',
            adminComment: '',
            createdAt: 'Сегодня, 10:45'
        },
        {
            id: 'ORD-100',
            userId: 'other_client',
            company: 'Боулинг-парк «Космос»',
            phone: '+7 (999) 444-55-66',
            lanes: '8',
            equipment: 'QubicaAMF 82-90',
            task: 'Плановое ТО и регулировка распределителя пинсеттеров',
            status: 'accepted',
            adminComment: 'Выезд инженера запланирован на завтра к 11:00',
            createdAt: 'Вчера, 18:20'
        }
    ];

    const getOrders = () => {
        const stored = localStorage.getItem(STORAGE_KEY_ORDERS);
        if (!stored) {
            localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(defaultOrders));
            return defaultOrders;
        }
        return JSON.parse(stored);
    };

    const saveOrders = (orders) => {
        localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
        renderUI();
    };

    const getCurrentUser = () => {
        const stored = localStorage.getItem(STORAGE_KEY_USER);
        return stored ? JSON.parse(stored) : null;
    };

    const setCurrentUser = (user) => {
        if (user) {
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        } else {
            localStorage.removeItem(STORAGE_KEY_USER);
        }
        renderUI();
    };

    // ================= 2. ЭЛЕМЕНТЫ ИНТЕРФЕЙСА =================
    const adminPanel = document.getElementById('adminPanel');
    const adminOrdersList = document.getElementById('adminOrdersList');
    const adminOrdersCount = document.getElementById('adminOrdersCount');
    const toggleAdminViewBtn = document.getElementById('toggleAdminViewBtn');
    const adminOrdersBody = document.getElementById('adminOrdersBody');
    const toggleAdminIcon = document.getElementById('toggleAdminIcon');

    const openAuthModalBtn = document.getElementById('openAuthModalBtn');
    const userProfileMenu = document.getElementById('userProfileMenu');
    const userDisplayName = document.getElementById('userDisplayName');
    const userRoleBadge = document.getElementById('userRoleBadge');
    const userAvatarText = document.getElementById('userAvatarText');
    const clientOrdersBtn = document.getElementById('clientOrdersBtn');
    const clientOrdersCount = document.getElementById('clientOrdersCount');
    const logoutBtn = document.getElementById('logoutBtn');
    const formUserIndicator = document.getElementById('formUserIndicator');

    const authModal = document.getElementById('authModal');
    const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
    const demoAdminBtn = document.getElementById('demoAdminBtn');
    const demoClientBtn = document.getElementById('demoClientBtn');
    const customAuthForm = document.getElementById('customAuthForm');

    const clientOrdersModal = document.getElementById('clientOrdersModal');
    const closeClientOrdersBtn = document.getElementById('closeClientOrdersBtn');
    const clientOrdersList = document.getElementById('clientOrdersList');

    // ================= 3. РЕНДЕРИНГ СОСТОЯНИЯ =================
    const renderUI = () => {
        const user = getCurrentUser();
        const orders = getOrders();

        // 1. Шапка & Пользователь
        if (user) {
            openAuthModalBtn.style.display = 'none';
            userProfileMenu.style.display = 'flex';
            userDisplayName.textContent = user.name;
            userRoleBadge.textContent = user.role === 'admin' ? 'Инженер' : 'Клиент';
            userAvatarText.textContent = user.name.charAt(0).toUpperCase();

            formUserIndicator.textContent = `${user.name} (${user.role === 'admin' ? 'Инженер' : 'Клиент'})`;
            formUserIndicator.className = 'text-green';

            if (user.role === 'client') {
                clientOrdersBtn.style.display = 'inline-block';
                const myOrders = orders.filter(o => o.userId === user.id);
                clientOrdersCount.textContent = myOrders.length;
            } else {
                clientOrdersBtn.style.display = 'none';
            }
        } else {
            openAuthModalBtn.style.display = 'inline-flex';
            userProfileMenu.style.display = 'none';
            clientOrdersBtn.style.display = 'none';
            formUserIndicator.textContent = 'Гость (вход не выполнен)';
            formUserIndicator.className = 'text-amber';
        }

        // 2. Верхняя панель диспетчера
        if (user && user.role === 'admin') {
            adminPanel.style.display = 'block';
            const newCount = orders.filter(o => o.status === 'new').length;
            adminOrdersCount.textContent = `${newCount} новых`;
            renderAdminCards(orders);
        } else {
            adminPanel.style.display = 'none';
        }
    };

    const renderAdminCards = (orders) => {
        adminOrdersList.innerHTML = '';

        if (orders.length === 0) {
            adminOrdersList.innerHTML = '<div style="color: var(--text-dim); font-size: 13px; padding: 10px;">В реестре нет активных заявок.</div>';
            return;
        }

        orders.forEach(order => {
            const card = document.createElement('div');
            card.className = 'admin-card';

            let statusLabel = 'На рассмотрении';
            let statusClass = 'status-new';
            if (order.status === 'accepted') { statusLabel = 'Принята в работу'; statusClass = 'status-accepted'; }
            if (order.status === 'rejected') { statusLabel = 'Отклонена'; statusClass = 'status-rejected'; }

            card.innerHTML = `
                <div class="admin-card-head">
                    <span class="admin-card-id">${order.id} • ${order.createdAt}</span>
                    <span class="status-tag ${statusClass}">${statusLabel}</span>
                </div>
                <div class="admin-card-body">
                    <div><strong>Клуб:</strong> ${order.company} (${order.lanes} дор.)</div>
                    <div><strong>Тел:</strong> ${order.phone}</div>
                    <div><strong>Оборудование:</strong> ${order.equipment}</div>
                    <div style="margin-top: 4px; color: var(--text-main);"><strong>Проблема:</strong> ${order.task}</div>
                </div>

                ${order.adminComment ? `<div class="engineer-note"><strong>Ответ:</strong> ${order.adminComment}</div>` : ''}

                <input type="text" class="admin-comment-input" placeholder="Примечание/время выезда..." id="comment_${order.id}" value="${order.adminComment || ''}">

                <div class="admin-btn-row">
                    <button class="btn btn-sm btn-success" onclick="window.setOrderStatus('${order.id}', 'accepted')">✓ Принять</button>
                    <button class="btn btn-sm btn-danger" onclick="window.setOrderStatus('${order.id}', 'rejected')">✕ Отклонить</button>
                    <button class="btn btn-sm btn-secondary" onclick="window.removeOrder('${order.id}')">Удалить</button>
                </div>
            `;
            adminOrdersList.appendChild(card);
        });
    };

    // Глобальные методы управления заявками
    window.setOrderStatus = (orderId, newStatus) => {
        const orders = getOrders();
        const input = document.getElementById(`comment_${orderId}`);
        const comment = input ? input.value.trim() : '';

        const updated = orders.map(o => {
            if (o.id === orderId) {
                return { ...o, status: newStatus, adminComment: comment };
            }
            return o;
        });
        saveOrders(updated);
    };

    window.removeOrder = (orderId) => {
        if (confirm(`Удалить заявку ${orderId}?`)) {
            const orders = getOrders().filter(o => o.id !== orderId);
            saveOrders(orders);
        }
    };

    // ================= 4. ОБРАБОТЧИКИ СОБЫТИЙ =================
    // Сворачивание админ-дока
    if (toggleAdminViewBtn) {
        toggleAdminViewBtn.addEventListener('click', () => {
            adminOrdersBody.classList.toggle('collapsed');
            const isCollapsed = adminOrdersBody.classList.contains('collapsed');
            toggleAdminIcon.textContent = isCollapsed ? '▲' : '▼';
            toggleAdminViewBtn.innerHTML = `<span id="toggleAdminIcon">${isCollapsed ? '▲' : '▼'}</span> ${isCollapsed ? 'Развернуть реестр' : 'Свернуть реестр'}`;
        });
    }

    // Модалка авторизации
    openAuthModalBtn.addEventListener('click', () => authModal.classList.add('active'));
    closeAuthModalBtn.addEventListener('click', () => authModal.classList.remove('active'));

    demoAdminBtn.addEventListener('click', () => {
        setCurrentUser({ id: 'admin_nik', name: 'Дежурный инженер', role: 'admin' });
        authModal.classList.remove('active');
    });

    demoClientBtn.addEventListener('click', () => {
        setCurrentUser({ id: 'client_demo', name: 'РК «Арена»', role: 'client' });
        authModal.classList.remove('active');
    });

    customAuthForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('authName').value.trim();
        const role = document.getElementById('authRole').value;
        setCurrentUser({ id: 'user_' + Date.now(), name: name, role: role });
        authModal.classList.remove('active');
    });

    logoutBtn.addEventListener('click', () => setCurrentUser(null));

    // Модалка истории заявок клиента
    clientOrdersBtn.addEventListener('click', () => {
        const user = getCurrentUser();
        if (!user) return;

        const myOrders = getOrders().filter(o => o.userId === user.id);
        clientOrdersList.innerHTML = '';

        if (myOrders.length === 0) {
            clientOrdersList.innerHTML = '<div style="color: var(--text-dim); padding: 24px 0; text-align: center;">У вас пока нет оформленных заявок.</div>';
        } else {
            myOrders.forEach(order => {
                const item = document.createElement('div');
                item.className = 'client-order-box';

                let statusLabel = 'На рассмотрении';
                let statusClass = 'status-new';
                if (order.status === 'accepted') { statusLabel = 'Принята инженером'; statusClass = 'status-accepted'; }
                if (order.status === 'rejected') { statusLabel = 'Отклонена'; statusClass = 'status-rejected'; }

                item.innerHTML = `
                    <div class="client-order-head">
                        <span style="font-family: var(--font-mono); color: var(--accent); font-weight: 700;">${order.id} • ${order.createdAt}</span>
                        <span class="status-tag ${statusClass}">${statusLabel}</span>
                    </div>
                    <div style="font-size: 14px; margin-bottom: 4px;"><strong>Оборудование:</strong> ${order.equipment} (${order.lanes} дор.)</div>
                    <div style="font-size: 13px; color: var(--text-muted);"><strong>Проблема:</strong> ${order.task}</div>
                    ${order.adminComment ? `<div class="engineer-note"><strong>Ответ службы ТО:</strong> ${order.adminComment}</div>` : ''}
                `;
                clientOrdersList.appendChild(item);
            });
        }
        clientOrdersModal.classList.add('active');
    });

    closeClientOrdersBtn.addEventListener('click', () => clientOrdersModal.classList.remove('active'));

    // Закрытие окон по клику на фон
    [authModal, clientOrdersModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });

    // ================= 5. ОТПРАВКА НОВОЙ ЗАЯВКИ =================
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const user = getCurrentUser();
            const company = document.getElementById('company').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const lanes = document.getElementById('lanes').value;
            const equipment = document.getElementById('equipment').value;
            const task = document.getElementById('task').value.trim();

            const newOrder = {
                id: 'ORD-' + Math.floor(100 + Math.random() * 900),
                userId: user ? user.id : 'guest_' + Date.now(),
                company: company,
                phone: phone,
                lanes: lanes,
                equipment: equipment,
                task: task,
                status: 'new',
                adminComment: '',
                createdAt: 'Только что'
            };

            const orders = getOrders();
            orders.unshift(newOrder);
            saveOrders(orders);

            alert(`✓ Заявка ${newOrder.id} успешно передана в реестр диспетчерской службы.`);
            orderForm.reset();
        });
    }

    // ================= 6. СКРОЛЛ, ЧИСЛА И ЧАТ =================
    const revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length > 0) {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
        }, { threshold: 0.08 });
        revealEls.forEach(el => obs.observe(el));
    }

    const counters = document.querySelectorAll('.spec-num');
    let counted = false;
    const statsSec = document.querySelector('.stats-row');
    if (statsSec) {
        const statsObs = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !counted) {
                counted = true;
                counters.forEach(c => {
                    const target = +c.getAttribute('data-target');
                    let cur = 0;
                    const step = target / 35;
                    const t = setInterval(() => {
                        cur += step;
                        if (cur >= target) { c.textContent = target; clearInterval(t); }
                        else c.textContent = Math.floor(cur);
                    }, 25);
                });
            }
        });
        statsObs.observe(statsSec);
    }

    const chatWidget = document.getElementById('chatWidget');
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    const chatCloseBtn = document.getElementById('chatCloseBtn');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const quickReplies = document.getElementById('quickReplies');

    if (chatToggleBtn) chatToggleBtn.addEventListener('click', () => chatWidget.classList.toggle('open'));
    if (chatCloseBtn) chatCloseBtn.addEventListener('click', () => chatWidget.classList.remove('open'));

    const addChatMsg = (text, sender = 'bot') => {
        const msg = document.createElement('div');
        msg.className = `message msg-${sender}`;
        msg.innerHTML = `<div class="msg-bubble">${text}</div><span class="msg-time">Только что</span>`;
        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = chatInput.value.trim();
            if (!val) return;
            addChatMsg(val, 'user');
            chatInput.value = '';
            setTimeout(() => addChatMsg('Информация зафиксирована. Вы также можете оставить официальную заявку в форме ниже.', 'bot'), 600);
        });
    }

    if (quickReplies) {
        quickReplies.addEventListener('click', (e) => {
            const btn = e.target.closest('.quick-btn');
            if (btn) {
                const text = btn.getAttribute('data-text');
                addChatMsg(text, 'user');
                setTimeout(() => addChatMsg('Дежурный инженер принял обращение. Вы можете оформить заявку на сайте.', 'bot'), 600);
            }
        });
    }

    // Инициализация при старте
    renderUI();
});