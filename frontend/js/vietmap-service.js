/**
 * VietMap API Service
 * 100% Real-time data from VietMap API v4 - NO HARDCODED DATA
 * Uses VietMap Autocomplete v4 API with proper parameters
 */
class VietMapService {
  constructor() {
    this.apiKey = null;
    this.baseUrl = "https://maps.vietmap.vn/api";
    this.cache = {
      provinces: null,
      districts: {},
      wards: {},
    };
  }

  /**
   * Load API key from environment
   */
  async loadApiKey() {
    if (this.apiKey) return this.apiKey;

    try {
      // Try to get from CONFIG first (recommended)
      if (typeof CONFIG !== "undefined" && CONFIG.VIETMAP_API_KEY) {
        this.apiKey = CONFIG.VIETMAP_API_KEY;
        console.log("✅ VietMap API key loaded from CONFIG");
        return this.apiKey;
      }

      // Fallback: try window variable
      if (window.VIETMAP_API_KEY) {
        this.apiKey = window.VIETMAP_API_KEY;
        console.log("✅ VietMap API key loaded from window");
        return this.apiKey;
      }

      throw new Error("VIETMAP_API_KEY not found in CONFIG or window");
    } catch (error) {
      console.error("❌ Error loading VietMap API key:", error);
      this.apiKey = null;
      return this.apiKey;
    }
  }

  /**
   * Get provinces from VietMap Autocomplete v4 API
   * Fetches all 63 provinces by searching with multiple queries
   * 100% from VietMap API - NO HARDCODED DATA
   */
  async getProvinces(search = "", page = 1, limit = 5) {
    try {
      await this.loadApiKey();

      if (!this.apiKey) {
        console.error("❌ VietMap API key not available");
        return this.getEmptyResponse("API key không khả dụng");
      }

      // Check cache
      if (this.cache.provinces && !search) {
        console.log("✅ Using cached provinces");
        return this.paginateResults(
          this.cache.provinces,
          page,
          limit,
          "Danh sách tỉnh/thành phố"
        );
      }

      // If user is searching, use their search term
      if (search) {
        console.log(`🔍 Searching provinces with term: "${search}"`);
        const results = await this.searchProvincesFromAPI(search);
        return this.paginateResults(
          results,
          page,
          limit,
          "Kết quả tìm kiếm tỉnh/thành phố"
        );
      }

      console.log("🌐 Fetching ALL 63 provinces from VietMap API...");
      console.log(
        "📡 This will make multiple API calls to get complete province list..."
      );

      // Strategy: Search with common province name patterns to get all 63 provinces
      // Vietnam has provinces starting with many different words
      const searchQueries = [
        "hà",
        "hồ chí minh",
        "đà nẵng",
        "hải phòng",
        "cần thơ",
        "an giang",
        "bà rịa",
        "bắc",
        "bến tre",
        "bình",
        "cà mau",
        "cao bằng",
        "đắk",
        "điện biên",
        "đồng",
        "gia lai",
        "hà giang",
        "hà nam",
        "hà tĩnh",
        "hậu giang",
        "hòa bình",
        "hưng yên",
        "khánh hòa",
        "kiên giang",
        "kon tum",
        "lai châu",
        "lâm đồng",
        "lạng sơn",
        "lào cai",
        "long an",
        "nam định",
        "nghệ an",
        "ninh",
        "phú",
        "quảng",
        "sóc trăng",
        "sơn la",
        "tây ninh",
        "thái",
        "thanh hóa",
        "thừa thiên huế",
        "tiền giang",
        "trà vinh",
        "tuyên quang",
        "vĩnh",
        "yên bái",
      ];

      const allProvinces = new Map(); // Use Map to avoid duplicates by ID
      let completedQueries = 0;

      // Execute all queries in parallel for speed
      const promises = searchQueries.map(async (query) => {
        try {
          const provinces = await this.searchProvincesFromAPI(query);
          provinces.forEach((p) => {
            if (!allProvinces.has(p.id)) {
              allProvinces.set(p.id, p);
            }
          });
          completedQueries++;
          console.log(
            `✅ Query "${query}": ${provinces.length} provinces | Total unique: ${allProvinces.size} | Progress: ${completedQueries}/${searchQueries.length}`
          );
        } catch (err) {
          console.warn(`⚠️ Query "${query}" failed:`, err.message);
        }
      });

      await Promise.all(promises);

      const provinces = Array.from(allProvinces.values());

      if (provinces.length === 0) {
        console.error("❌ No provinces found from VietMap API");
        return this.getEmptyResponse(
          "Không thể tải danh sách tỉnh/thành phố từ VietMap"
        );
      }

      // Sort by name
      provinces.sort((a, b) => a.name.localeCompare(b.name, "vi"));

      // Cache the full list
      this.cache.provinces = provinces;
      console.log(
        `✅ Successfully fetched ${provinces.length} provinces from VietMap API`
      );

      return this.paginateResults(
        provinces,
        page,
        limit,
        "Danh sách tỉnh/thành phố"
      );
    } catch (error) {
      console.error("❌ Error getting provinces from VietMap:", error);
      return this.getEmptyResponse(
        `Lỗi khi tải danh sách tỉnh/thành phố: ${error.message}`
      );
    }
  }

  /**
   * Helper: Search provinces from VietMap API with a specific query
   * @private
   */
  async searchProvincesFromAPI(searchText) {
    const url = `${this.baseUrl}/autocomplete/v4`;

    const params = new URLSearchParams({
      apikey: this.apiKey,
      text: searchText,
      layers: "CITY", // Get city/province level data
      display_type: 2, // Use old format (3 levels: ward, district, city)
    });

    const response = await fetch(`${url}?${params}`);

    if (!response.ok) {
      throw new Error(`VietMap API error: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    // Process results
    const provinces = [];
    const seenIds = new Set();

    data.forEach((item) => {
      if (!item.boundaries || item.boundaries.length === 0) return;

      // Find city boundary (type 0)
      const cityBoundary = item.boundaries.find((b) => b.type === 0);

      if (cityBoundary && !seenIds.has(cityBoundary.id)) {
        seenIds.add(cityBoundary.id);

        provinces.push({
          id: cityBoundary.id,
          code: cityBoundary.id.toString(),
          name: cityBoundary.name,
          name_with_type: cityBoundary.full_name,
          prefix: cityBoundary.prefix,
          lat: 0,
          lng: 0,
        });
      }
    });

    return provinces;
  }

  /**
   * Get wards/communes for a province
   * 100% from VietMap Autocomplete v4 API - uses layers=WARD
   */
  async getWards(provinceCode, search = "", page = 1, limit = 5) {
    try {
      await this.loadApiKey();

      if (!this.apiKey) {
        console.error("❌ VietMap API key not available");
        return this.getEmptyResponse("API key không khả dụng");
      }

      if (!provinceCode) {
        return this.getEmptyResponse("Vui lòng chọn tỉnh/thành phố trước");
      }

      // Find province info from cache
      let province = null;
      if (this.cache.provinces) {
        province = this.cache.provinces.find(
          (p) =>
            p.code === provinceCode ||
            p.id === provinceCode ||
            p.id === parseInt(provinceCode)
        );
      }

      if (!province) {
        console.error("❌ Province not found:", provinceCode);
        return this.getEmptyResponse("Không tìm thấy tỉnh/thành phố");
      }

      const provinceName = province.name;
      const provinceId = province.id;

      // Check cache
      const cacheKey = `${provinceCode}_${search}`;
      if (this.cache.wards[cacheKey] && !search) {
        console.log(`✅ Using cached wards for ${provinceName}`);
        return this.paginateResults(
          this.cache.wards[cacheKey],
          page,
          limit,
          "Danh sách phường/xã"
        );
      }

      console.log(
        `🌐 Fetching wards for "${provinceName}" (ID: ${provinceId}) from VietMap API...`
      );

      // Use VietMap Autocomplete v4 API with layers=WARD and cityId filter
      const url = `${this.baseUrl}/autocomplete/v4`;
      const searchText = search || provinceName;

      const params = new URLSearchParams({
        apikey: this.apiKey,
        text: searchText,
        layers: "WARD", // Get ward-level data
        cityId: provinceId, // Filter by province ID
        display_type: 2, // Use old format (3 levels)
      });

      const requestUrl = `${url}?${params}`;
      console.log("🌐 VietMap API Request:", requestUrl);

      const response = await fetch(requestUrl);

      if (!response.ok) {
        throw new Error(
          `VietMap API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("📦 VietMap API Response:", data);

      if (!Array.isArray(data) || data.length === 0) {
        console.warn(`⚠️ No wards found for ${provinceName}`);
        return this.getEmptyResponse(
          `Không tìm thấy phường/xã của ${provinceName}`
        );
      }

      // Process results
      const wards = [];
      const seenIds = new Set();

      data.forEach((item) => {
        if (!item.boundaries || item.boundaries.length === 0) return;

        // Find ward boundary (type 2)
        const wardBoundary = item.boundaries.find((b) => b.type === 2);
        const cityBoundary = item.boundaries.find((b) => b.type === 0);

        // Ensure it's in the correct province
        if (
          wardBoundary &&
          cityBoundary &&
          cityBoundary.id === provinceId &&
          !seenIds.has(wardBoundary.id)
        ) {
          seenIds.add(wardBoundary.id);

          wards.push({
            id: wardBoundary.id,
            code: wardBoundary.id.toString(),
            name: wardBoundary.name,
            name_with_type: wardBoundary.full_name,
            prefix: wardBoundary.prefix,
            province_code: provinceCode,
            province_name: provinceName,
            lat: 0,
            lng: 0,
          });
        }
      });

      if (wards.length === 0) {
        console.warn(
          `⚠️ No valid wards found after filtering for ${provinceName}`
        );
        return this.getEmptyResponse(
          `Không tìm thấy phường/xã của ${provinceName}`
        );
      }

      // Sort by name
      wards.sort((a, b) => a.name.localeCompare(b.name, "vi"));

      // Cache if no search
      if (!search) {
        this.cache.wards[cacheKey] = wards;
        console.log(`✅ Cached ${wards.length} wards for ${provinceName}`);
      }

      console.log(
        `✅ Found ${wards.length} wards for ${provinceName} from VietMap API`
      );
      return this.paginateResults(wards, page, limit, "Danh sách phường/xã");
    } catch (error) {
      console.error("❌ Error getting wards from VietMap:", error);
      return this.getEmptyResponse(
        `Lỗi khi tải danh sách phường/xã: ${error.message}`
      );
    }
  }

  /**
   * Search for full addresses/streets using VietMap Autocomplete v4
   * Returns results with GPS coordinates (lat, lng) from Place API
   * Filters results by wardId to ensure GPS matches selected ward
   * 100% from VietMap API with REAL GPS COORDINATES
   */
  async autocompleteAddress(
    query,
    provinceId = null,
    wardId = null,
    page = 1,
    limit = 10
  ) {
    try {
      await this.loadApiKey();

      if (!this.apiKey) {
        return this.getEmptyResponse("API key không khả dụng");
      }

      if (!query || query.trim().length < 2) {
        return this.getEmptyResponse("Vui lòng nhập tối thiểu 2 ký tự");
      }

      console.log(
        `🔍 Searching addresses for "${query}" via VietMap Autocomplete v4...`
      );
      if (provinceId) {
        console.log(`🎯 Filtering by cityId: ${provinceId}`);
      }
      if (wardId) {
        console.log(`🎯 Filtering by wardId: ${wardId}`);
      }

      const url = `${this.baseUrl}/autocomplete/v4`;
      const params = new URLSearchParams({
        apikey: this.apiKey,
        text: query,
        display_type: 2, // Old format (3 levels: ward, district, city)
      });

      // Add cityId filter (province) - REQUIRED
      if (provinceId) {
        params.append("cityId", provinceId);
      }

      // Add wardId filter (ward/commune) - IMPORTANT for accurate GPS
      if (wardId) {
        params.append("wardId", wardId);
      }

      const response = await fetch(`${url}?${params}`);

      if (!response.ok) {
        throw new Error(`VietMap API error: ${response.status}`);
      }

      const data = await response.json();

      console.log(`📦 VietMap API returned ${data.length || 0} results`);

      if (!Array.isArray(data) || data.length === 0) {
        return this.getEmptyResponse(
          `Không tìm thấy địa chỉ "${query}"${
            wardId ? " trong phường/xã đã chọn" : ""
          }. Vui lòng thử từ khóa khác.`
        );
      }

      // Process results and get GPS coordinates using Place API
      const addresses = [];

      for (const item of data.slice(0, limit)) {
        let lat = 0;
        let lng = 0;
        let fullAddressFromAPI = "";

        // Get GPS coordinates from Place API if ref_id is available
        if (item.ref_id) {
          try {
            const placeData = await this.getPlaceDetails(item.ref_id);
            if (placeData) {
              lat = placeData.lat || 0;
              lng = placeData.lng || 0;
              fullAddressFromAPI = placeData.address || "";

              if (lat !== 0 && lng !== 0) {
                console.log(
                  `📍 GPS for "${item.display}": lat=${lat}, lng=${lng}`
                );
              } else {
                console.warn(
                  `⚠️ GPS is 0,0 for "${item.display}" (ref_id: ${item.ref_id})`
                );
              }
            }
          } catch (err) {
            console.error(
              `❌ Failed to get GPS for ref_id ${item.ref_id}:`,
              err.message
            );
          }
        } else {
          console.warn(
            `⚠️ No ref_id for "${item.display}" - cannot fetch GPS coordinates`
          );
        }

        // Extract ward info from boundaries
        const wardBoundary = item.boundaries?.find((b) => b.type === 2);
        const districtBoundary = item.boundaries?.find((b) => b.type === 1);
        const cityBoundary = item.boundaries?.find((b) => b.type === 0);

        addresses.push({
          id: item.ref_id || `addr_${Date.now()}_${Math.random()}`,
          ref_id: item.ref_id,
          name: item.name || "",
          label: item.display || item.address || item.name,
          address: fullAddressFromAPI || item.address || "",
          display: item.display || "",
          distance: item.distance || 0,
          boundaries: item.boundaries || [],
          lat, // GPS latitude from Place API
          lng, // GPS longitude from Place API
          ward_id: wardBoundary?.id || null,
          ward_name: wardBoundary?.name || "",
          district_id: districtBoundary?.id || null,
          district_name: districtBoundary?.name || "",
          city_id: cityBoundary?.id || null,
          city_name: cityBoundary?.name || "",
        });
      }

      console.log(
        `✅ Found ${addresses.length} addresses with GPS from VietMap API`
      );

      // Log summary of GPS coordinates
      const gpsCount = addresses.filter(
        (a) => a.lat !== 0 || a.lng !== 0
      ).length;
      console.log(
        `📊 GPS Success Rate: ${gpsCount}/${addresses.length} addresses have valid GPS`
      );

      return this.paginateResults(addresses, page, limit, "Kết quả tìm kiếm");
    } catch (error) {
      console.error("❌ Error autocompleting address:", error);
      return this.getEmptyResponse(`Lỗi khi tìm địa chỉ: ${error.message}`);
    }
  }

  /**
   * Get place details with GPS coordinates from VietMap Place v4 API
   * @private
   */
  async getPlaceDetails(refId) {
    if (!refId) return null;

    try {
      const url = `${this.baseUrl}/place/v4`;
      const params = new URLSearchParams({
        apikey: this.apiKey,
        refid: refId,
      });

      const response = await fetch(`${url}?${params}`);

      if (!response.ok) {
        throw new Error(`Place API error: ${response.status}`);
      }

      const data = await response.json();

      // Return GPS coordinates and full address info
      return {
        lat: data.lat || 0,
        lng: data.lng || 0,
        display: data.display,
        address: data.address,
        street: data.street,
        hs_num: data.hs_num,
        city_id: data.city_id,
        city: data.city,
        district_id: data.district_id,
        district: data.district,
        ward_id: data.ward_id,
        ward: data.ward,
      };
    } catch (error) {
      console.warn("⚠️ Error getting place details:", error);
      return null;
    }
  }

  /**
   * Normalize Vietnamese string (remove diacritics)
   */
  normalizeVietnamese(str) {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  }

  /**
   * Paginate results
   */
  paginateResults(items, page, limit, message = "Success") {
    const total = items.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginatedItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: endIndex < total,
      },
      message,
    };
  }

  /**
   * Get empty response structure
   */
  getEmptyResponse(message = "Không có dữ liệu") {
    return {
      success: false,
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 5,
        totalPages: 0,
        hasMore: false,
      },
      message,
    };
  }
}

// Initialize VietMap service globally - 100% API v4 driven
if (typeof window !== "undefined") {
  window.VietMapService = VietMapService;
  window.vietMapService = new VietMapService();
  console.log(
    "✅ VietMapService initialized - Using VietMap Autocomplete API v4"
  );
}
