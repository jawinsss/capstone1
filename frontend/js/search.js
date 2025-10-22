// Smart Search Functionality for MatFlow
class SmartSearch {
    constructor() {
        this.products = [];
        this.categories = [];
        this.searchHistory = [];
        this.init();
    }

    init() {
        this.loadProducts();
        this.setupSearchEventListeners();
    }

    // Load products from API
    async loadProducts() {
        try {
            const response = await window.apiService.get('/products?take=1000');
            if (response?.success) {
                // Handle nested data structure: response.data.data
                const data = response.data?.data || response.data;
                this.products = Array.isArray(data) ? data : [];
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    // Setup search event listeners
    setupSearchEventListeners() {
        const searchInput = document.getElementById('hpSearch');
        const searchResults = document.getElementById('searchResults');
        const searchSuggestions = document.getElementById('searchSuggestions');

        if (!searchInput) return;

        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            clearTimeout(searchTimeout);
            
            if (query.length === 0) {
                this.hideResults();
                return;
            }

            if (query.length < 2) {
                this.showSuggestions(query);
                return;
            }

            searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 300);
        });

        searchInput.addEventListener('focus', () => {
            const query = searchInput.value.trim();
            if (query.length > 0) {
                this.showSuggestions(query);
            }
        });

        // Handle Enter key press
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query.length > 0) {
                    this.redirectToSearchPage(query);
                }
            }
        });

        // Hide results when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults?.contains(e.target)) {
                this.hideResults();
            }
        });
    }

    // Normalize Vietnamese text (remove diacritics)
    normalizeVietnamese(text) {
        if (!text) return '';
        
        const diacriticsMap = {
            'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a', 'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
            'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
            'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
            'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o', 'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
            'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u', 'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
            'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
            'đ': 'd',
            'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A', 'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
            'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
            'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',
            'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
            'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
            'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',
            'Đ': 'D'
        };

        return text.replace(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/g, (char) => diacriticsMap[char] || char);
    }

    // Calculate Levenshtein distance for fuzzy matching
    levenshteinDistance(str1, str2) {
        const matrix = [];
        const len1 = str1.length;
        const len2 = str2.length;

        for (let i = 0; i <= len2; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= len1; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= len2; i++) {
            for (let j = 1; j <= len1; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[len2][len1];
    }

    // Calculate similarity score
    calculateSimilarity(str1, str2) {
        const normalized1 = this.normalizeVietnamese(str1.toLowerCase());
        const normalized2 = this.normalizeVietnamese(str2.toLowerCase());
        
        const distance = this.levenshteinDistance(normalized1, normalized2);
        const maxLength = Math.max(normalized1.length, normalized2.length);
        
        return maxLength === 0 ? 1 : 1 - (distance / maxLength);
    }

    // Check if query matches product (with various matching strategies)
    matchesProduct(product, query) {
        const normalizedQuery = this.normalizeVietnamese(query.toLowerCase());
        const productName = this.normalizeVietnamese(product.name?.toLowerCase() || '');
        const productDesc = this.normalizeVietnamese(product.description?.toLowerCase() || '');
        const categoryName = this.normalizeVietnamese(product.category?.name?.toLowerCase() || '');

        // Exact match
        if (productName.includes(normalizedQuery) || productDesc.includes(normalizedQuery)) {
            return { score: 1, type: 'exact' };
        }

        // Partial match
        const nameWords = productName.split(/\s+/);
        const queryWords = normalizedQuery.split(/\s+/);
        
        let partialScore = 0;
        for (const queryWord of queryWords) {
            for (const nameWord of nameWords) {
                if (nameWord.includes(queryWord) || queryWord.includes(nameWord)) {
                    partialScore += 0.8;
                    break;
                }
            }
        }
        
        if (partialScore > 0) {
            return { score: partialScore / queryWords.length, type: 'partial' };
        }

        // Fuzzy match
        const nameSimilarity = this.calculateSimilarity(product.name, query);
        const descSimilarity = this.calculateSimilarity(product.description, query);
        const categorySimilarity = this.calculateSimilarity(product.category?.name, query);
        
        const maxSimilarity = Math.max(nameSimilarity, descSimilarity, categorySimilarity);
        
        if (maxSimilarity > 0.6) {
            return { score: maxSimilarity, type: 'fuzzy' };
        }

        // Abbreviation match (e.g., "sat thep" matches "sắt thép")
        const abbreviations = this.getAbbreviations(product.name);
        for (const abbrev of abbreviations) {
            if (this.calculateSimilarity(abbrev, query) > 0.7) {
                return { score: 0.7, type: 'abbreviation' };
            }
        }

        return { score: 0, type: 'none' };
    }

    // Generate abbreviations for Vietnamese terms
    getAbbreviations(text) {
        const abbrevMap = {
            'sắt thép': 'sat thep',
            'hóa chất': 'hoa chat',
            'máy móc': 'may moc',
            'thiết bị': 'thiet bi',
            'bảo hộ': 'bao ho',
            'lao động': 'lao dong',
            'vật tư': 'vat tu',
            'vật liệu': 'vat lieu',
            'xây dựng': 'xay dung',
            'công nghiệp': 'cong nghiep',
            'chất lượng': 'chat luong',
            'giá rẻ': 'gia re',
            'tốt nhất': 'tot nhat'
        };

        const normalized = this.normalizeVietnamese(text.toLowerCase());
        const abbreviations = [];
        
        for (const [full, abbrev] of Object.entries(abbrevMap)) {
            if (normalized.includes(full)) {
                abbreviations.push(abbrev);
            }
        }
        
        return abbreviations;
    }

    // Perform smart search
    performSearch(query) {
        if (!query || query.length < 2) return;

        const results = [];
        
        for (const product of this.products) {
            const match = this.matchesProduct(product, query);
            if (match.score > 0.5) {
                results.push({
                    ...product,
                    matchScore: match.score,
                    matchType: match.type
                });
            }
        }

        // Sort by relevance
        results.sort((a, b) => {
            if (a.matchType === 'exact' && b.matchType !== 'exact') return -1;
            if (b.matchType === 'exact' && a.matchType !== 'exact') return 1;
            return b.matchScore - a.matchScore;
        });

        this.displayResults(results.slice(0, 10), query);
        this.addToSearchHistory(query);
    }

    // Display search results
    displayResults(results, query) {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="search-no-results">
                    <i class="fa-solid fa-search"></i>
                    <p>Không tìm thấy sản phẩm nào cho "${query}"</p>
                    <small>Thử tìm kiếm với từ khóa khác</small>
                </div>
            `;
        } else {
            searchResults.innerHTML = `
                <div class="search-results-header">
                    <span>Tìm thấy ${results.length} sản phẩm</span>
                </div>
                <div class="search-results-list">
                    ${results.map(product => `
                        <div class="search-result-item" data-product-id="${product.id}">
                            <img src="${product.images?.[0]?.url || 'https://via.placeholder.com/60x60?text=MatFlow'}" 
                                 alt="${product.name}" 
                                 loading="lazy"
                                 style="width:60px;height:60px;object-fit:contain;background:#fff;border-radius:8px">
                            <div class="search-result-info">
                                <h4>${this.highlightMatch(product.name, query)}</h4>
                                <p class="search-result-price">${this.formatVND(product.price)}</p>
                                <small class="search-result-category">${product.category?.name || ''}</small>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            // Add click handlers
            searchResults.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const productId = item.dataset.productId;
                    this.openProductDetail(productId);
                });
            });
        }

        searchResults.style.display = 'block';
    }

    // Highlight matching text
    highlightMatch(text, query) {
        const normalizedText = this.normalizeVietnamese(text.toLowerCase());
        const normalizedQuery = this.normalizeVietnamese(query.toLowerCase());
        
        if (normalizedText.includes(normalizedQuery)) {
            const index = normalizedText.indexOf(normalizedQuery);
            const before = text.substring(0, index);
            const match = text.substring(index, index + query.length);
            const after = text.substring(index + query.length);
            
            return `${before}<mark>${match}</mark>${after}`;
        }
        
        return text;
    }

    // Show search suggestions
    showSuggestions(query) {
        const searchSuggestions = document.getElementById('searchSuggestions');
        if (!searchSuggestions) return;

        const suggestions = this.getSuggestions(query);
        
        if (suggestions.length > 0) {
            searchSuggestions.innerHTML = `
                <div class="search-suggestions">
                    ${suggestions.map(suggestion => `
                        <div class="search-suggestion-item" data-query="${suggestion}">
                            <i class="fa-solid fa-search"></i>
                            <span>${suggestion}</span>
                        </div>
                    `).join('')}
                </div>
            `;

            // Add click handlers
            searchSuggestions.querySelectorAll('.search-suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const query = item.dataset.query;
                    document.getElementById('hpSearch').value = query;
                    this.performSearch(query);
                });
            });

            searchSuggestions.style.display = 'block';
        } else {
            searchSuggestions.style.display = 'none';
        }
    }

    // Get search suggestions
    getSuggestions(query) {
        const suggestions = [];
        const normalizedQuery = this.normalizeVietnamese(query.toLowerCase());
        
        // Get suggestions from search history
        this.searchHistory.forEach(historyItem => {
            if (this.normalizeVietnamese(historyItem.toLowerCase()).includes(normalizedQuery)) {
                suggestions.push(historyItem);
            }
        });
        
        // Get suggestions from product names
        const productNames = [...new Set(this.products.map(p => p.name))];
        productNames.forEach(name => {
            if (this.normalizeVietnamese(name.toLowerCase()).includes(normalizedQuery)) {
                suggestions.push(name);
            }
        });
        
        return [...new Set(suggestions)].slice(0, 5);
    }

    // Hide search results
    hideResults() {
        const searchResults = document.getElementById('searchResults');
        const searchSuggestions = document.getElementById('searchSuggestions');
        
        if (searchResults) searchResults.style.display = 'none';
        if (searchSuggestions) searchSuggestions.style.display = 'none';
    }

    // Add to search history
    addToSearchHistory(query) {
        if (!query || query.length < 2) return;
        
        this.searchHistory = this.searchHistory.filter(item => item !== query);
        this.searchHistory.unshift(query);
        this.searchHistory = this.searchHistory.slice(0, 10);
        
        localStorage.setItem('matflow_search_history', JSON.stringify(this.searchHistory));
    }

    // Load search history
    loadSearchHistory() {
        try {
            const history = localStorage.getItem('matflow_search_history');
            if (history) {
                this.searchHistory = JSON.parse(history);
            }
        } catch (error) {
            console.error('Error loading search history:', error);
        }
    }

    // Open product detail
    openProductDetail(productId) {
        if (window.openDetail) {
            window.openDetail(productId);
        }
        this.hideResults();
    }

    // Redirect to search results page
    redirectToSearchPage(query) {
        const encodedQuery = encodeURIComponent(query);
        window.location.href = `../pages/search-result.html?q=${encodedQuery}`;
    }

    // Format VND currency
    formatVND(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(amount);
    }
}

// Initialize smart search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.smartSearch = new SmartSearch();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartSearch;
}
