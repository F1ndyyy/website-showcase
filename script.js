document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Плавное появление элементов при скролле (Scroll Reveal)
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // 2. Анимация чисел счетчика
    const counterElements = document.querySelectorAll('.spec-num');
    let countersStarted = false;

    const startCounters = () => {
        counterElements.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const duration = 1200; // 1.2 сек
            const stepTime = 20;
            const steps = duration / stepTime;
            const increment = target / steps;
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.textContent = target;
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current);
                }
            }, stepTime);
        });
    };

    const specsSection = document.querySelector('.specs-grid');
    if (specsSection) {
        const statsObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !countersStarted) {
                countersStarted = true;
                startCounters();
            }
        }, { threshold: 0.3 });

        statsObserver.observe(specsSection);
    }

    // 3. Динамическая интерактивная подсветка карточек за курсором
    const cards = document.querySelectorAll('.glow-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.background = `radial-gradient(400px circle at ${x}px ${y}px, rgba(240, 136, 62, 0.07), var(--bg-card))`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.background = 'var(--bg-card)';
        });
    });

    // 4. Обработка формы
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const company = document.getElementById('company').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const submitBtn = orderForm.querySelector('button[type="submit"]');

            if (!company || !phone) return;

            // Визуальная индикация процесса отправки
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Регистрация в журнале...</span>';

            setTimeout(() => {
                alert(`✓ Заявка принята!\n\nОбъект: ${company}\nТелефон: ${phone}\n\nДежурный специалист свяжется с вами в течение 15 минут.`);
                orderForm.reset();
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<span>Зарегистрировать заявку</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>`;
            }, 600);
        });
    }
});