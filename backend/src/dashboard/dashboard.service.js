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
exports.DashboardService = void 0;
var common_1 = require("@nestjs/common");
var DashboardService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var DashboardService = _classThis = /** @class */ (function () {
        function DashboardService_1(prisma) {
            this.prisma = prisma;
        }
        DashboardService_1.prototype.getOverview = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a, totalRevenue, pendingOrders, pendingProducts, openTickets;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.prisma.payment.aggregate({ where: { status: 'CONFIRMED' }, _sum: { amount: true } }),
                                this.prisma.order.count({ where: { status: 'PENDING' } }),
                                this.prisma.product.count({ where: { isActive: false } }),
                                this.prisma.ticket.count({ where: { status: 'OPEN' } }),
                            ])];
                        case 1:
                            _a = _b.sent(), totalRevenue = _a[0], pendingOrders = _a[1], pendingProducts = _a[2], openTickets = _a[3];
                            return [2 /*return*/, {
                                    gmv: totalRevenue._sum.amount || 0,
                                    pendingOrders: pendingOrders,
                                    pendingProducts: pendingProducts,
                                    openTickets: openTickets,
                                }];
                    }
                });
            });
        };
        DashboardService_1.prototype.revenueLast7Days = function () {
            return __awaiter(this, void 0, void 0, function () {
                var since, payments, map, i, d, key, _i, payments_1, p, key;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            since = new Date();
                            since.setDate(since.getDate() - 6);
                            since.setHours(0, 0, 0, 0);
                            return [4 /*yield*/, this.prisma.payment.findMany({
                                    where: { status: 'CONFIRMED', createdAt: { gte: since } },
                                    select: { amount: true, createdAt: true },
                                    orderBy: { createdAt: 'asc' },
                                })];
                        case 1:
                            payments = _a.sent();
                            map = new Map();
                            for (i = 0; i < 7; i++) {
                                d = new Date(since);
                                d.setDate(since.getDate() + i);
                                key = d.toISOString().slice(0, 10);
                                map.set(key, 0);
                            }
                            for (_i = 0, payments_1 = payments; _i < payments_1.length; _i++) {
                                p = payments_1[_i];
                                key = p.createdAt.toISOString().slice(0, 10);
                                map.set(key, (map.get(key) || 0) + p.amount);
                            }
                            return [2 /*return*/, Array.from(map.entries()).map(function (_a) {
                                    var date = _a[0], amount = _a[1];
                                    return ({ date: date, amount: amount });
                                })];
                    }
                });
            });
        };
        DashboardService_1.prototype.revenueByRange = function () {
            return __awaiter(this, arguments, void 0, function (range) {
                var now, start, buckets, i, d, from, to, cur, i, from, to, key, y, m, base, i, from, to, key, payments, sums, _loop_1, _i, payments_2, p;
                if (range === void 0) { range = 'day'; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            now = new Date();
                            start = new Date(now);
                            start.setHours(0, 0, 0, 0);
                            buckets = [];
                            if (range === 'day') {
                                // last 7 days
                                start.setDate(start.getDate() - 6);
                                for (i = 0; i < 7; i++) {
                                    d = new Date(start);
                                    d.setDate(start.getDate() + i);
                                    from = new Date(d);
                                    to = new Date(d);
                                    to.setDate(d.getDate() + 1);
                                    buckets.push({ key: d.toISOString().slice(0, 10), from: from, to: to });
                                }
                            }
                            else if (range === 'week') {
                                cur = new Date(start);
                                cur.setDate(cur.getDate() - (cur.getDay() || 7) + 1); // set to Monday this week
                                cur.setDate(cur.getDate() - 7 * 7); // 8 weeks window
                                for (i = 0; i < 8; i++) {
                                    from = new Date(cur);
                                    from.setDate(cur.getDate() + i * 7);
                                    to = new Date(from);
                                    to.setDate(from.getDate() + 7);
                                    key = "".concat(from.getFullYear(), "-W").concat(i + 1);
                                    buckets.push({ key: key, from: from, to: to });
                                }
                            }
                            else {
                                y = start.getFullYear();
                                m = start.getMonth() - 11;
                                base = new Date(y, m, 1);
                                for (i = 0; i < 12; i++) {
                                    from = new Date(base.getFullYear(), base.getMonth() + i, 1);
                                    to = new Date(from.getFullYear(), from.getMonth() + 1, 1);
                                    key = "".concat(from.getFullYear(), "-").concat(String(from.getMonth() + 1).padStart(2, '0'));
                                    buckets.push({ key: key, from: from, to: to });
                                }
                            }
                            return [4 /*yield*/, this.prisma.payment.findMany({
                                    where: { status: 'CONFIRMED', createdAt: { gte: buckets[0].from } },
                                    select: { amount: true, createdAt: true },
                                    orderBy: { createdAt: 'asc' },
                                })];
                        case 1:
                            payments = _a.sent();
                            sums = buckets.map(function (b) { return ({ key: b.key, amount: 0 }); });
                            _loop_1 = function (p) {
                                var t = p.createdAt;
                                var idx = buckets.findIndex(function (b) { return t >= b.from && t < b.to; });
                                if (idx >= 0)
                                    sums[idx].amount += p.amount;
                            };
                            for (_i = 0, payments_2 = payments; _i < payments_2.length; _i++) {
                                p = payments_2[_i];
                                _loop_1(p);
                            }
                            return [2 /*return*/, sums];
                    }
                });
            });
        };
        return DashboardService_1;
    }());
    __setFunctionName(_classThis, "DashboardService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DashboardService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DashboardService = _classThis;
}();
exports.DashboardService = DashboardService;
