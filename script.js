        // DOM Elements
        const cameraBtn = document.getElementById('camera-btn');
        const uploadBtn = document.getElementById('upload-btn');
        const fileInput = document.getElementById('file-input');
        const cameraPreview = document.getElementById('camera-preview');
        const video = document.getElementById('video');
        const cancelCameraBtn = document.getElementById('cancel-camera-btn');
        const captureBtn = document.getElementById('capture-btn');
        const previewSection = document.getElementById('preview-section');
        const previewImage = document.getElementById('preview-image');
        const analyzeBtn = document.getElementById('analyze-btn');
        const loadingSection = document.getElementById('loading-section');
        const resultsSection = document.getElementById('results-section');
        const productGrid = document.getElementById('product-grid');
        const favoritesSection = document.getElementById('favorites-section');
        const favoritesGrid = document.getElementById('favorites-grid');
        const emptyFavorites = document.getElementById('empty-favorites');
        const navItems = document.querySelectorAll('.nav-item');
        const errorMessage = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        const steps = document.querySelectorAll('.steps');
        
        // State variables
        let stream = null;
        let favorites = JSON.parse(localStorage.getItem('beautyFinderFavorites')) || [];
        let currentImageData = null;
        
        // SerpAPI configuration
        const SERP_API_KEY = '53be83164949a15929561cc8dd7972440dffb4bb8fea13729e19eae132738f39'; // Replace with your actual API key
        const API_ENDPOINT = 'https://serpapi.com/search';
        
        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            showSection('upload-section');
            updateFavoritesDisplay();
        });
        
        // Event Listeners
        cameraBtn.addEventListener('click', startCamera);
        uploadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileUpload);
        cancelCameraBtn.addEventListener('click', cancelCamera);
        captureBtn.addEventListener('click', captureImage);
        analyzeBtn.addEventListener('click', analyzeImage);
        navItems.forEach(item => item.addEventListener('click', handleNavClick));
        
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Filter products
                const filter = this.getAttribute('data-filter');
                filterProducts(filter);
            });
        });
        
        // Functions
        function showSection(sectionId) {
            // Hide all sections
            document.querySelectorAll('.card').forEach(card => {
                card.style.display = 'none';
            });
            
            // Show selected section
            document.getElementById(sectionId).style.display = 'block';
        }
        
        function handleNavClick() {
            const tab = this.getAttribute('data-tab');
            
            // Update active nav item
            navItems.forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding section
            showSection(tab);
        }
        
        async function startCamera() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' },
                    audio: false 
                });
                video.srcObject = stream;
                cameraPreview.style.display = 'block';
                showSection('camera-preview');
                hideError();
            } catch (err) {
                showError('Kamera-Zugriff fehlgeschlagen: ' + err.message);
            }
        }
        
        function cancelCamera() {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
            showSection('upload-section');
            hideError();
        }
        
        function captureImage() {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Stop camera stream
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
            
            // Display preview
            currentImageData = canvas.toDataURL('image/jpeg');
            previewImage.src = currentImageData;
            previewSection.style.display = 'block';
            showSection('preview-section');
            hideError();
        }
        
        function handleFileUpload(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    currentImageData = event.target.result;
                    previewImage.src = currentImageData;
                    previewSection.style.display = 'block';
                    showSection('preview-section');
                    hideError();
                };
                reader.readAsDataURL(file);
            }
        }
        
        function analyzeImage() {
            if (!currentImageData) {
                showError('Bitte lade zuerst ein Bild hoch oder mache ein Foto.');
                return;
            }
            
            // Show loading state
            loadingSection.style.display = 'flex';
            showSection('loading-section');
            hideError();
            
            // Convert Data URL to Blob
            const blob = dataURItoBlob(currentImageData);
            
            // Create form data with the image
            const formData = new FormData();
            formData.append('image', blob, 'product.jpg');
            
            // First upload the image to a temporary host
            uploadImageToTempHost(formData)
                .then(imageUrl => {
                    // Now call SerpAPI with the image URL
                    return callSerpAPI(imageUrl);
                })
                .then(products => {
                    // Display the results
                    displayResults(products);
                    showSection('results-section');
                    
                    // Set active nav to results
                    navItems.forEach(item => item.classList.remove('active'));
                    document.querySelector('[data-tab="results-section"]').classList.add('active');
                })
                .catch(error => {
                    showError('Fehler bei der Produktsuche: ' + error.message);
                    showSection('preview-section');
                })
                .finally(() => {
                    loadingSection.style.display = 'none';
                });
        }
        
        // Convert Data URL to Blob
        function dataURItoBlob(dataURI) {
            const byteString = atob(dataURI.split(',')[1]);
            const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            
            return new Blob([ab], { type: mimeString });
        }
        
        // Upload image to a temporary host (mock implementation)
        function uploadImageToTempHost(formData) {
            return new Promise((resolve, reject) => {
                // In a real application, you would upload the image to your server
                // For this demo, we'll simulate an upload and return a mock URL
                setTimeout(() => {

                    fetch('https://your-image-upload-api.com/upload', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => resolve(data.imageUrl))
                    .catch(error => reject(error));
                }, 500);
            });
        }
        
        // Call SerpAPI with the image URL
        function callSerpAPI(imageUrl) {
            return new Promise((resolve, reject) => {
                // For demo purposes, we'll use mock data
                setTimeout(() => {

                    
                    //resolve(mockResponse.visual_matches);
                    
                    const params = new URLSearchParams({
                        engine: 'google_lens',
                        url: imageUrl,
                        api_key: '53be83164949a15929561cc8dd7972440dffb4bb8fea13729e19eae132738f39',
                        hl: 'de',
                        country: 'de'
                    });
                    
                    fetch(`${API_ENDPOINT}?${params}`)
                        .then(response => response.json())
                        .then(data => {
                            if (data.visual_matches && data.visual_matches.length > 0) {
                                resolve(data.visual_matches);
                            } else {
                                reject(new Error('Keine Produkte gefunden'));
                            }
                        })
                        .catch(error => reject(error));

                }, 1500);
            });
        }
        
        function displayResults(products) {
            productGrid.innerHTML = '';
            
            if (!products || products.length === 0) {
                showError('Keine Produkte gefunden. Bitte versuche es mit einem anderen Bild.');
                showSection('preview-section');
                return;
            }
            
            // Limit to 8 products
            const limitedProducts = products.slice(0, 8);
            
            // Add products to grid
            limitedProducts.forEach(product => {
                const productCard = createProductCard(product);
                productGrid.appendChild(productCard);
            });
        }
        
        function createProductCard(product) {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            // Use link as unique ID
            const productId = product.link;
            const isFavorite = favorites.some(fav => fav.link === productId);
            
            card.innerHTML = `
                <div class="product-image">
                    <img src="${product.thumbnail || 'https://via.placeholder.com/150'}" alt="${product.title}">
                </div>
                <div class="product-info">
                    <div class="product-brand">${product.source}</div>
                    <div class="product-name">${product.title}</div>
                    <div class="product-price">
                        ${product.price ? `€${product.price.extracted_value.toFixed(2)}` : 'Preis nicht verfügbar'}
                    </div>
                    <div class="product-actions">
                        <a href="${product.link}" target="_blank" class="action-btn">
                            <i class="fas fa-shopping-bag"></i>
                        </a>
                        <div class="action-btn favorite-btn ${isFavorite ? 'active' : ''}" data-id="${productId}">
                            <i class="fas fa-heart"></i>
                        </div>
                    </div>
                </div>
            `;
            
            // Add favorite event listener
            const favBtn = card.querySelector('.favorite-btn');
            favBtn.addEventListener('click', () => toggleFavorite(product));
            
            return card;
        }
        
        function toggleFavorite(product) {
            const productId = product.link;
            const index = favorites.findIndex(fav => fav.link === productId);
            
            if (index > -1) {
                // Remove from favorites
                favorites.splice(index, 1);
            } else {
                // Add to favorites
                favorites.push(product);
            }
            
            // Save to localStorage
            localStorage.setItem('beautyFinderFavorites', JSON.stringify(favorites));
            
            // Update UI
            updateFavoritesDisplay();
            
            // Update the favorite button in the results grid
            const favButtons = document.querySelectorAll(`.favorite-btn[data-id="${productId}"]`);
            favButtons.forEach(btn => {
                btn.classList.toggle('active', index === -1);
            });
        }
        
        function updateFavoritesDisplay() {
            favoritesGrid.innerHTML = '';
            
            if (favorites.length === 0) {
                emptyFavorites.style.display = 'block';
                return;
            }
            
            emptyFavorites.style.display = 'none';
            
            // Add favorite products to grid
            favorites.forEach(product => {
                const productCard = createProductCard(product);
                favoritesGrid.appendChild(productCard);
            });
        }
        
        function filterProducts(filter) {
            const productCards = document.querySelectorAll('#product-grid .product-card');
            
            productCards.forEach(card => {
                const priceText = card.querySelector('.product-price').textContent;
                const price = parseFloat(priceText.replace('€', '')) || 0;
                
                switch(filter) {
                    case 'low':
                        card.style.display = price < 15 ? 'block' : 'none';
                        break;
                    case 'high':
                        card.style.display = price >= 15 ? 'block' : 'none';
                        break;
                    default:
                        card.style.display = 'block';
                }
            });
        }
        
        function showError(message) {
            errorText.textContent = message;
            errorMessage.style.display = 'block';
        }
        
        function hideError() {
            errorMessage.style.display = 'none';
        }