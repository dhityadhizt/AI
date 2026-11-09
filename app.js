document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const customPromptInput = document.getElementById('customPrompt');
    const btnSave = document.getElementById('btnSave');
    const btnStart = document.getElementById('btnStart');
    const floatingTrigger = document.getElementById('floatingTrigger');
    const flashPopup = document.getElementById('flashPopup');
    const popupContent = document.getElementById('popupContent');

    // Load saved settings
    if (localStorage.getItem('qw_apikey')) {
        apiKeyInput.value = localStorage.getItem('qw_apikey');
    }
    if (localStorage.getItem('qw_prompt')) {
        customPromptInput.value = localStorage.getItem('qw_prompt');
    }

    btnSave.addEventListener('click', () => {
        localStorage.setItem('qw_apikey', apiKeyInput.value.trim());
        localStorage.setItem('qw_prompt', customPromptInput.value.trim());
        alert('Pengaturan berhasil disimpan!');
    });

    // Make floating button draggable for Android
    let isDragging = false;
    let startX, startY, initialX, initialY;

    floatingTrigger.addEventListener('touchstart', (e) => {
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        const rect = floatingTrigger.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
    }, {passive: true});

    window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        floatingTrigger.style.left = `${initialX + dx}px`;
        floatingTrigger.style.top = `${initialY + dy}px`;
        floatingTrigger.style.bottom = 'auto';
        floatingTrigger.style.right = 'auto';
    }, {passive: true});

    window.addEventListener('touchend', () => {
        isDragging = false;
    });

    // Trigger action when floating button is clicked/tapped
    floatingTrigger.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim() || localStorage.getItem('qw_apikey');
        const promptText = customPromptInput.value.trim() || localStorage.getItem('qw_prompt') || "Berikan jawaban singkat dari teks berikut:";

        if (!apiKey) {
            alert('Harap masukkan API Key terlebih dahulu di menu utama!');
            return;
        }

        // Ambil teks yang sedang diseleksi atau seluruh teks body halaman
        let selectedText = window.getSelection().toString();
        if (!selectedText) {
            selectedText = document.body.innerText.substring(0, 2500); // Ambil ringkasan teks halaman
        }

        if (!selectedText.trim()) {
            showPopup("Tidak ada teks terbaca.");
            return;
        }

        showPopup("Memproses...");

        try {
            // Menggunakan endpoint Gemini API standar
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${promptText}\n\nTeks Sumber:\n${selectedText}`
                        }]
                    }]
                })
            });

            const data = await response.json();
            if (data.candidates && data.candidates[0].content.parts[0].text) {
                const answer = data.candidates[0].content.parts[0].text;
                showPopup(answer, 1000); // Tampil tepat 1 detik secara samar
            } else {
                showPopup("Gagal mendapatkan respons.");
            }
        } catch (err) {
            showPopup("Terjadi kesalahan jaringan.");
        }
    });

    function showPopup(text, duration = 1500) {
        popupContent.innerText = text;
        flashPopup.classList.remove('hidden');
        
        // Auto-hide setelah durasi tertentu (default 1 detik / 1000ms)
        setTimeout(() => {
            flashPopup.classList.add('hidden');
        }, duration);
    }
});
