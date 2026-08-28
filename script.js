/**
 * NIKBOWLING — Инженерная служба
 */
const CONFIG = {
    GOOGLE_TELEGRAM_GATEWAY: 'https://script.google.com/macros/s/AKfycbz_2AhoIOUHnYNP_8WhuoD2QOz4YyMXJkWYgWqlqoW-vUXOgOpxU779kBhcBHlHw2_U/exec',
    SUPABASE_URL: 'https://fdvgqonhlvonksbgfkez.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkdmdxb25obHZvbmtzYmdma2V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MzkyNDEsImV4cCI6MjEwMzMxNTI0MX0.9ZUU-Zka9RbERVTzkeJW4_qcbSW7x9ITHbRnY8D6hS8' 
};

document.addEventListener('DOMContentLoaded', () => {

    // ================= 1. БАЗА ДАННЫХ И ХРАНИЛИЩЕ =================
    const STORAGE_KEY_USER = 'nb_current_user';
    const STORAGE_KEY_ORDERS = 'nb_orders';
    const STORAGE_KEY_USERS = 'nb_users_local';

    let supabaseClient = null;
    if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY && window.supabase) {
        supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    }

    const defaultUsers = [
        { id: 'nikita', password: 'admin777', name: 'Никита', role: 'admin' }
    ];

    const getLocalUsers = () => {
        const stored = localStorage.getItem(STORAGE_KEY_USERS);
        if (!stored) {
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(defaultUsers));
            return defaultUsers;
        }
        return JSON.parse(stored);
    };

    const getLocalOrders = () => {
        const stored = localStorage.getItem(STORAGE_KEY_ORDERS);
        return stored ? JSON.parse(stored) : [];
    };

    const saveLocalOrders = (orders) => {
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

    // ================= 2. ОТПРАВКА ОПОВЕЩЕНИЙ В TELEGRAM =================
    async function sendTelegramAlert(order) {
        if (!CONFIG.GOOGLE_TELEGRAM_GATEWAY) return false;

        try {
            await fetch(CONFIG.GOOGLE_TELEGRAM_GATEWAY, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(order)
            });
            console.log('✓ Заявка передана в Telegram-шлюз');
            return true;
        } catch (err) {
            console.error('Ошибка отправки в Telegram:', err);
            return false;
        }
    }

    // ================= 3. ИНТЕРФЕЙС И ЭЛЕМЕНТЫ =================
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
    const authForm = document.getElementById('authForm');
    const authLogin = document.getElementById('authLogin');
    const authPassword = document.getElementById('authPassword');
    const authName = document.getElementById('authName');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const toggleRegisterBtn = document.getElementById('toggleRegisterBtn');
    const registerFields = document.getElementById('registerFields');

    const clientOrdersModal = document.getElementById('clientOrdersModal');
    const closeClientOrdersBtn = document.getElementById('closeClientOrdersBtn');
    const clientOrdersList = document.getElementById('clientOrdersList');

    let isRegisterMode = false;

    // ================= 4. АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ =================
    toggleRegisterBtn.addEventListener('click', () => {
        isRegisterMode = !isRegisterMode;
        if (isRegisterMode) {
            registerFields.style.display = 'flex';
            authSubmitBtn.textContent = 'Зарегистрироваться';
            toggleRegisterBtn.textContent = 'У меня есть аккаунт';
        } else {
            registerFields.style.display = 'none';
            authSubmitBtn.textContent = 'Войти';
            toggleRegisterBtn.textContent = 'Регистрация';
        }
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const login = authLogin.value.trim().toLowerCase();
        const password = authPassword.value.trim();

        if (!login || !password) return;

        if (isRegisterMode) {
            const name = authName.value.trim() || login;
            const newUser = { id: login, password: password, name: name, role: 'client' };

            if (supabaseClient) {
                const { error } = await supabaseClient.from('users').insert([newUser]);
                if (error) {
                    alert('Логин уже занят или произошла ошибка при регистрации.');
                    return;
                }
            } else {
                const users = getLocalUsers();
                if (users.find(u => u.id === login)) {
                    alert('Такой логин уже существует.');
                    return;
                }
                users.push(newUser);
                localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
            }

            setCurrentUser({ id: newUser.id, name: newUser.name, role: newUser.role });
            authModal.classList.remove('active');
            authForm.reset();
        } else {
            let foundUser = null;

            if (supabaseClient) {
                const { data } = await supabaseClient
                    .from('users')
                    .select('*')
                    .eq('id', login)
                    .eq('password', password)
                    .maybeSingle();
                foundUser = data;
            }

            if (!foundUser) {
                const users = getLocalUsers();
                foundUser = users.find(u => u.id === login && u.password === password);
            }

            if (foundUser) {
                setCurrentUser({ id: foundUser.id, name: foundUser.name, role: foundUser.role });
                authModal.classList.remove('active');
                authForm.reset();
            } else {
                alert('Неверный логин или пароль.');
            }
        }
    });

    logoutBtn.addEventListener('click', () => setCurrentUser(null));

    // ================= 5. ПОЛУЧЕНИЕ И ОТОБРАЖЕНИЕ ЗАЯВОК =================
    async function fetchAllOrders() {
        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient
                    .from('orders')
                    .select('*');
                if (!error && data) return data;
            } catch (e) {
                console.error('Ошибка Supabase:', e);
            }
        }
        return getLocalOrders();
    }

    async function renderUI() {
        const user = getCurrentUser();
        const orders = await fetchAllOrders();

        if (user) {
            openAuthModalBtn.style.display = 'none';
            userProfileMenu.style.display = 'flex';
            userDisplayName.textContent = user.name;
            userRoleBadge.textContent = user.role === 'admin' ? 'Глав.Инженер' : 'Клиент';
            userAvatarText.textContent = user.name.charAt(0).toUpperCase();

            formUserIndicator.textContent = `${user.name} (${user.role === 'admin' ? 'Глав.Инженер' : 'Клиент'})`;
            formUserIndicator.className = 'text-green';

            if (user.role === 'client') {
                clientOrdersBtn.style.display = 'inline-block';
                const myOrders = orders.filter(o => o.user_id === user.id);
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

        if (user && user.role === 'admin') {
            adminPanel.style.display = 'block';
            const newCount = orders.filter(o => o.status === 'new').length;
            adminOrdersCount.textContent = `${newCount} новых`;
            renderAdminCards(orders);
        } else {
            adminPanel.style.display = 'none';
        }

        // 👈 ВОТ ЭТА СТРОЧКА: мгновенно обновляет права и кнопки в новостях без перезагрузки страницы
        if (typeof renderDigest === 'function') {
            renderDigest();
        }
    }

    function renderAdminCards(orders) {
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
                    <span class="admin-card-id">${order.id} • ${order.created_at || 'Только что'}</span>
                    <span class="status-tag ${statusClass}">${statusLabel}</span>
                </div>
                <div class="admin-card-body">
                    <div><strong>Клуб:</strong> ${order.company} (${order.lanes} дор.)</div>
                    <div><strong>Клиент (логин):</strong> ${order.user_id || 'Гость'}</div>
                    <div><strong>Тел:</strong> ${order.phone}</div>
                    <div><strong>Система:</strong> ${order.equipment}</div>
                    <div style="margin-top: 4px; color: var(--text-main);"><strong>Проблема:</strong> ${order.task}</div>
                </div>

                ${order.admin_comment ? `<div class="engineer-note"><strong>Ответ Глав.Инженера:</strong> ${order.admin_comment}</div>` : ''}

                <input type="text" class="admin-comment-input" placeholder="Примечание/время выезда..." id="comment_${order.id}" value="${order.admin_comment || ''}">

                <div class="admin-btn-row">
                    <button class="btn btn-sm btn-success" onclick="window.setOrderStatus('${order.id}', 'accepted')">✓ Принять</button>
                    <button class="btn btn-sm btn-danger" onclick="window.setOrderStatus('${order.id}', 'rejected')">✕ Отклонить</button>
                    <button class="btn btn-sm btn-secondary" onclick="window.removeOrder('${order.id}')">Удалить</button>
                </div>
            `;
            adminOrdersList.appendChild(card);
        });
    }

    window.setOrderStatus = async (orderId, newStatus) => {
        const input = document.getElementById(`comment_${orderId}`);
        const comment = input ? input.value.trim() : '';

        if (supabaseClient) {
            await supabaseClient
                .from('orders')
                .update({ status: newStatus, admin_comment: comment })
                .eq('id', orderId);
        } else {
            const orders = getLocalOrders().map(o => {
                if (o.id === orderId) {
                    return { ...o, status: newStatus, admin_comment: comment };
                }
                return o;
            });
            saveLocalOrders(orders);
        }
        renderUI();
    };

    window.removeOrder = async (orderId) => {
        if (confirm(`Удалить заявку ${orderId}?`)) {
            if (supabaseClient) {
                await supabaseClient.from('orders').delete().eq('id', orderId);
            } else {
                const orders = getLocalOrders().filter(o => o.id !== orderId);
                saveLocalOrders(orders);
            }
            renderUI();
        }
    };

    // ================= 6. ОКНО ЗАЯВОК КЛИЕНТА =================
    clientOrdersBtn.addEventListener('click', async () => {
        const user = getCurrentUser();
        if (!user) return;

        const allOrders = await fetchAllOrders();
        const myOrders = allOrders.filter(o => o.user_id === user.id);
        clientOrdersList.innerHTML = '';

        if (myOrders.length === 0) {
            clientOrdersList.innerHTML = '<div style="color: var(--text-dim); padding: 24px 0; text-align: center;">У вас пока нет оформленных заявок.</div>';
        } else {
            myOrders.forEach(order => {
                const item = document.createElement('div');
                item.className = 'client-order-box';

                let statusLabel = 'На рассмотрении';
                let statusClass = 'status-new';
                if (order.status === 'accepted') { statusLabel = 'Принята в работу'; statusClass = 'status-accepted'; }
                if (order.status === 'rejected') { statusLabel = 'Отклонена'; statusClass = 'status-rejected'; }

                item.innerHTML = `
                    <div class="client-order-head">
                        <span style="font-family: var(--font-mono); color: var(--accent); font-weight: 700;">${order.id} • ${order.created_at || 'Только что'}</span>
                        <span class="status-tag ${statusClass}">${statusLabel}</span>
                    </div>
                    <div style="font-size: 14px; margin-bottom: 4px;"><strong>Оборудование/ПО:</strong> ${order.equipment} (${order.lanes} дор.)</div>
                    <div style="font-size: 13px; color: var(--text-muted);"><strong>Проблема:</strong> ${order.task}</div>
                    ${order.admin_comment ? `<div class="engineer-note"><strong>Ответ Глав.Инженера:</strong> ${order.admin_comment}</div>` : ''}
                `;
                clientOrdersList.appendChild(item);
            });
        }
        clientOrdersModal.classList.add('active');
    });

    // ================= 7. ОТПРАВКА ЗАЯВКИ С ФОРМЫ =================
    const orderForm = document.getElementById('orderForm');
    const submitBtn = document.getElementById('submitOrderBtn');

    if (orderForm) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const user = getCurrentUser();
            const company = document.getElementById('company').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const lanes = document.getElementById('lanes').value;
            const equipment = document.getElementById('equipment').value;
            const task = document.getElementById('task').value.trim();

            const dateStr = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

            const newOrder = {
                id: 'ORD-' + Math.floor(100 + Math.random() * 900),
                user_id: user ? user.id : 'guest',
                company: company,
                phone: phone,
                lanes: lanes,
                equipment: equipment,
                task: task,
                status: 'new',
                admin_comment: '',
                created_at: dateStr
            };

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>Регистрация заявки...</span>';
            }

            if (supabaseClient) {
                try {
                    await supabaseClient.from('orders').insert([newOrder]);
                } catch (err) {
                    console.error('Ошибка базы данных:', err);
                }
            } else {
                const orders = getLocalOrders();
                orders.unshift(newOrder);
                saveLocalOrders(orders);
            }

            await sendTelegramAlert(newOrder);

            alert(`✓ Заявка ${newOrder.id} успешно передана Главному Инженеру!`);
            orderForm.reset();

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>Отправить заявку Главному Инженеру</span>';
            }

            renderUI();
        });
    }

    // ================= 8. НАВИГАЦИЯ И МОДАЛКИ =================
    if (toggleAdminViewBtn) {
        toggleAdminViewBtn.addEventListener('click', () => {
            adminOrdersBody.classList.toggle('collapsed');
            const isCollapsed = adminOrdersBody.classList.contains('collapsed');
            toggleAdminIcon.textContent = isCollapsed ? '▲' : '▼';
            toggleAdminViewBtn.innerHTML = `<span id="toggleAdminIcon">${isCollapsed ? '▲' : '▼'}</span> ${isCollapsed ? 'Развернуть реестр' : 'Свернуть реестр'}`;
        });
    }

    openAuthModalBtn.addEventListener('click', () => authModal.classList.add('active'));
    closeAuthModalBtn.addEventListener('click', () => authModal.classList.remove('active'));
    closeClientOrdersBtn.addEventListener('click', () => clientOrdersModal.classList.remove('active'));

    [authModal, clientOrdersModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });

    // ================= 9. АНИМАЦИИ =================
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

    // ================= 10. ЖУРНАЛ И ДАЙДЖЕСТ =================
    const newsGrid = document.getElementById('newsGrid');
    const openAddNewsModalBtn = document.getElementById('openAddNewsModalBtn');
    const addNewsModal = document.getElementById('addNewsModal');
    const closeAddNewsModalBtn = document.getElementById('closeAddNewsModalBtn');
    const addNewsForm = document.getElementById('addNewsForm');
    const newsPills = document.querySelectorAll('.news-pill');

    let digestPosts = [];
    let currentNewsFilter = 'all';

    async function loadDigest() {
        if (!newsGrid) return;

        if (supabaseClient) {
            const { data } = await supabaseClient
                .from('news')
                .select('*')
                .order('id', { ascending: false });
            digestPosts = data || [];
        } else {
            digestPosts = [
                {
                    id: 1,
                    title: 'Регламент проверки натяжителей цепей QubicaAMF 82-70',
                    category: 'Механика',
                    content: 'При плановом осмотре особое внимание уделяйте натяжению и смазке цепных приводов шасси. Своевременная регулировка предотвращает рассинхронизацию стола.',
                    author: 'Никита (Глав.Инженер)',
                    created_at: '28.08.2026'
                },
                {
                    id: 2,
                    title: 'Настройка сетевых модулей подсчета очков Steltronic',
                    category: 'ПО Steltronic',
                    content: 'Опубликована памятка по проверке заземления кабелей и калибровке оптики камер фиксации кеглей для бесперебойного подсчета очков.',
                    author: 'Инженерная служба',
                    created_at: '25.08.2026'
                }
            ];
        }
        renderDigest();
    }

    function renderDigest() {
        if (!newsGrid) return;
        const user = getCurrentUser();
        const canManage = user && (user.role === 'admin' || user.role === 'smm');

        if (openAddNewsModalBtn) {
            openAddNewsModalBtn.style.display = canManage ? 'inline-flex' : 'none';
        }

        const filtered = currentNewsFilter === 'all' 
            ? digestPosts 
            : digestPosts.filter(p => p.category === currentNewsFilter);

        newsGrid.innerHTML = '';

        if (filtered.length === 0) {
            newsGrid.innerHTML = '<div style="color: var(--text-dim); padding: 40px; text-align: center; grid-column: 1/-1;">В этой категории пока нет записей.</div>';
            return;
        }

        filtered.forEach(item => {
            const card = document.createElement('div');
            card.className = 'digest-card';

            let tagColor = 'var(--accent)';
            if (item.category === 'Механика') tagColor = 'var(--red)';
            if (item.category === 'ПО Steltronic') tagColor = 'var(--blue)';

            card.style.setProperty('--card-accent', tagColor);

            card.innerHTML = `
                <div class="digest-card-top">
                    <span class="digest-badge" style="color: ${tagColor}; background: ${tagColor}15; border: 1px solid ${tagColor}40;">${item.category}</span>
                    <span class="digest-date">${item.created_at}</span>
                </div>
                <h3 class="digest-title">${item.title}</h3>
                <p class="digest-content">${item.content}</p>
                <div class="digest-footer">
                    <span class="digest-author">👨‍🔧 ${item.author}</span>
                    ${canManage ? `<button class="btn-digest-del" onclick="deleteDigestPost(${item.id})">Удалить</button>` : ''}
                </div>
            `;
            newsGrid.appendChild(card);
        });
    }

    newsPills.forEach(pill => {
        pill.addEventListener('click', () => {
            newsPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentNewsFilter = pill.getAttribute('data-category');
            renderDigest();
        });
    });

    if (addNewsForm) {
        addNewsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('newsTitle').value.trim();
            const category = document.getElementById('newsCategory').value;
            const author = document.getElementById('newsAuthor').value.trim();
            const content = document.getElementById('newsContent').value.trim();

            const dateStr = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

            const newPost = { title, category, author, content, created_at: dateStr };

            if (supabaseClient) {
                await supabaseClient.from('news').insert([newPost]);
            } else {
                newPost.id = Date.now();
                digestPosts.unshift(newPost);
            }

            addNewsForm.reset();
            if (addNewsModal) addNewsModal.classList.remove('active');
            await loadDigest();
        });
    }

    window.deleteDigestPost = async (id) => {
        if (confirm('Удалить эту заметку из журнала?')) {
            if (supabaseClient) {
                await supabaseClient.from('news').delete().eq('id', id);
            } else {
                digestPosts = digestPosts.filter(p => p.id !== id);
            }
            await loadDigest();
        }
    };

    if (openAddNewsModalBtn) openAddNewsModalBtn.addEventListener('click', () => addNewsModal.classList.add('active'));
    if (closeAddNewsModalBtn) closeAddNewsModalBtn.addEventListener('click', () => addNewsModal.classList.remove('active'));


    loadDigest();

    renderUI();
});