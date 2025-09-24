"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
var common_1 = require("@nestjs/common");
var ProductsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ProductsService = _classThis = /** @class */ (function () {
        function ProductsService_1(prisma) {
            this.prisma = prisma;
        }
        ProductsService_1.prototype.findAll = function (params) {
            return __awaiter(this, void 0, void 0, function () {
                var take, page, skip, where, orderBy, _a, items, total;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            take = Math.min(Math.max(Number(params === null || params === void 0 ? void 0 : params.take) || 12, 1), 100);
                            page = Math.max(Number(params === null || params === void 0 ? void 0 : params.page) || 1, 1);
                            skip = (page - 1) * take;
                            where = {};
                            if (params === null || params === void 0 ? void 0 : params.categoryId)
                                where.categoryId = params.categoryId;
                            if (params === null || params === void 0 ? void 0 : params.q)
                                where.name = { contains: String(params.q), mode: 'insensitive' };
                            if ((params === null || params === void 0 ? void 0 : params.minPrice) || (params === null || params === void 0 ? void 0 : params.maxPrice))
                                where.price = {
                                    gte: params.minPrice ? Math.trunc(params.minPrice) : undefined,
                                    lte: params.maxPrice ? Math.trunc(params.maxPrice) : undefined,
                                };
                            if ((params === null || params === void 0 ? void 0 : params.sort) === 'price_asc') {
                                orderBy = { price: 'asc' };
                            }
                            else if ((params === null || params === void 0 ? void 0 : params.sort) === 'price_desc') {
                                orderBy = { price: 'desc' };
                            }
                            else {
                                orderBy = { createdAt: 'desc' };
                            }
                            return [4 /*yield*/, this.prisma.$transaction([
                                    this.prisma.product.findMany({ where: where, include: { images: true, category: true }, orderBy: orderBy, skip: skip, take: take }),
                                    this.prisma.product.count({ where: where }),
                                ])];
                        case 1:
                            _a = _b.sent(), items = _a[0], total = _a[1];
                            return [2 /*return*/, { items: items, total: total, page: page, take: take, pages: Math.ceil(total / take) }];
                    }
                });
            });
        };
        ProductsService_1.prototype.findOne = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var product;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.product.findUnique({
                                where: { id: id },
                                include: { images: true, category: true },
                            })];
                        case 1:
                            product = _a.sent();
                            if (!product)
                                throw new common_1.NotFoundException('Product not found');
                            return [2 /*return*/, product];
                    }
                });
            });
        };
        ProductsService_1.prototype.create = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, _b;
                var _c, _d;
                var _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            _b = (_a = this.prisma.product).create;
                            _c = {};
                            _d = {
                                name: dto.name
                            };
                            return [4 /*yield*/, this.generateUniqueSlug(dto.name)];
                        case 1: return [2 /*return*/, _b.apply(_a, [(_c.data = (_d.slug = _f.sent(),
                                    _d.description = dto.description,
                                    _d.price = Math.max(0, Math.trunc(dto.price || 0)),
                                    _d.stock = Math.max(0, Math.trunc(dto.stock || 0)),
                                    _d.categoryId = dto.categoryId,
                                    _d.images = ((_e = dto.images) === null || _e === void 0 ? void 0 : _e.length)
                                        ? { create: dto.images.map(function (i) { var _a; return ({ url: i.url, alt: i.alt, order: (_a = i.order) !== null && _a !== void 0 ? _a : 0 }); }) }
                                        : undefined,
                                    _d),
                                    _c.include = { images: true, category: true },
                                    _c)])];
                    }
                });
            });
        };
        ProductsService_1.prototype.update = function (id, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, _b, _c;
                var _d, _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0: return [4 /*yield*/, this.ensureExists(id)];
                        case 1:
                            _f.sent();
                            _b = (_a = this.prisma.product).update;
                            _d = {
                                where: { id: id }
                            };
                            _e = {
                                name: dto.name
                            };
                            if (!dto.name) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.generateUniqueSlug(dto.name)];
                        case 2:
                            _c = _f.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            _c = undefined;
                            _f.label = 4;
                        case 4: return [2 /*return*/, _b.apply(_a, [(_d.data = (_e.slug = _c,
                                    _e.description = dto.description,
                                    _e.price = dto.price !== undefined ? Math.max(0, Math.trunc(dto.price)) : undefined,
                                    _e.stock = dto.stock !== undefined ? Math.max(0, Math.trunc(dto.stock)) : undefined,
                                    _e.categoryId = dto.categoryId,
                                    _e.isActive = dto.isActive,
                                    // For simplicity, replace images if provided
                                    _e.images = dto.images
                                        ? {
                                            deleteMany: { productId: id },
                                            create: dto.images.map(function (i) { var _a; return ({ url: i.url, alt: i.alt, order: (_a = i.order) !== null && _a !== void 0 ? _a : 0 }); }),
                                        }
                                        : undefined,
                                    _e),
                                    _d.include = { images: true, category: true },
                                    _d)])];
                    }
                });
            });
        };
        ProductsService_1.prototype.remove = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.ensureExists(id)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.productImage.deleteMany({ where: { productId: id } })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, this.prisma.product.delete({ where: { id: id } })];
                    }
                });
            });
        };
        ProductsService_1.prototype.ensureExists = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var exists;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.product.findUnique({ where: { id: id }, select: { id: true } })];
                        case 1:
                            exists = _a.sent();
                            if (!exists)
                                throw new common_1.NotFoundException('Product not found');
                            return [2 /*return*/];
                    }
                });
            });
        };
        ProductsService_1.prototype.generateUniqueSlug = function (name) {
            return __awaiter(this, void 0, void 0, function () {
                var base, slug, i;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            base = name
                                .toLowerCase()
                                .normalize('NFD')
                                .replace(/\p{Diacritic}/gu, '')
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/(^-|-$)+/g, '');
                            slug = base || 'product';
                            i = 1;
                            _a.label = 1;
                        case 1: return [4 /*yield*/, this.prisma.product.findFirst({ where: { slug: slug }, select: { id: true } })];
                        case 2:
                            if (!_a.sent()) return [3 /*break*/, 3];
                            slug = "".concat(base, "-").concat(i++);
                            return [3 /*break*/, 1];
                        case 3: return [2 /*return*/, slug];
                    }
                });
            });
        };
        return ProductsService_1;
    }());
    __setFunctionName(_classThis, "ProductsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ProductsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ProductsService = _classThis;
}();
exports.ProductsService = ProductsService;
