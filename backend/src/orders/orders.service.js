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
exports.OrdersService = void 0;
var common_1 = require("@nestjs/common");
var OrdersService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var OrdersService = _classThis = /** @class */ (function () {
        function OrdersService_1(prisma) {
            this.prisma = prisma;
        }
        OrdersService_1.prototype.list = function () {
            return this.prisma.order.findMany({
                include: { items: { include: { product: true } }, user: true },
                orderBy: { createdAt: 'desc' },
            });
        };
        OrdersService_1.prototype.updateStatus = function (id, status) {
            return __awaiter(this, void 0, void 0, function () {
                var exists;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.order.findUnique({ where: { id: id }, select: { id: true } })];
                        case 1:
                            exists = _a.sent();
                            if (!exists)
                                throw new common_1.NotFoundException('Order not found');
                            return [2 /*return*/, this.prisma.order.update({ where: { id: id }, data: { status: status } })];
                    }
                });
            });
        };
        OrdersService_1.prototype.create = function (payload) {
            return __awaiter(this, void 0, void 0, function () {
                var code, productIds, products, priceMap, items, totalAmount, email, user, order;
                var _a, _b, _c, _d, _e, _f, _g, _h;
                return __generator(this, function (_j) {
                    switch (_j.label) {
                        case 0:
                            code = "ORD-".concat(Date.now());
                            productIds = (payload.items || []).map(function (i) { return i.productId; });
                            return [4 /*yield*/, this.prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, price: true } })];
                        case 1:
                            products = _j.sent();
                            priceMap = new Map(products.map(function (p) { return [p.id, p.price]; }));
                            items = (payload.items || []).map(function (i) { return ({
                                productId: i.productId,
                                quantity: Math.max(1, Number(i.quantity) || 1),
                                price: priceMap.get(i.productId) || 0,
                            }); });
                            totalAmount = items.reduce(function (s, i) { return s + i.price * i.quantity; }, 0);
                            email = ((_a = payload === null || payload === void 0 ? void 0 : payload.customer) === null || _a === void 0 ? void 0 : _a.email) || "guest-".concat(Date.now(), "@example.com");
                            return [4 /*yield*/, this.prisma.user.upsert({
                                    where: { email: email },
                                    update: { fullName: (_c = (_b = payload === null || payload === void 0 ? void 0 : payload.customer) === null || _b === void 0 ? void 0 : _b.fullName) !== null && _c !== void 0 ? _c : 'Khách hàng', phone: (_d = payload === null || payload === void 0 ? void 0 : payload.customer) === null || _d === void 0 ? void 0 : _d.phone },
                                    create: {
                                        email: email,
                                        username: email,
                                        password: email, // placeholder; not used for login
                                        fullName: (_f = (_e = payload === null || payload === void 0 ? void 0 : payload.customer) === null || _e === void 0 ? void 0 : _e.fullName) !== null && _f !== void 0 ? _f : 'Khách hàng',
                                        phone: (_g = payload === null || payload === void 0 ? void 0 : payload.customer) === null || _g === void 0 ? void 0 : _g.phone,
                                        role: 'USER',
                                    },
                                })];
                        case 2:
                            user = _j.sent();
                            return [4 /*yield*/, this.prisma.order.create({
                                    data: {
                                        code: code,
                                        userId: user.id,
                                        status: 'PENDING',
                                        totalAmount: totalAmount,
                                        items: { create: items },
                                    },
                                    include: { items: true },
                                })];
                        case 3:
                            order = _j.sent();
                            if (!(((_h = payload === null || payload === void 0 ? void 0 : payload.payment) === null || _h === void 0 ? void 0 : _h.amount) > 0)) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.prisma.payment.create({ data: { orderId: order.id, amount: Math.trunc(payload.payment.amount), status: 'PENDING' } })];
                        case 4:
                            _j.sent();
                            _j.label = 5;
                        case 5: return [2 /*return*/, order];
                    }
                });
            });
        };
        return OrdersService_1;
    }());
    __setFunctionName(_classThis, "OrdersService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OrdersService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OrdersService = _classThis;
}();
exports.OrdersService = OrdersService;
