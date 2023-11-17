"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
var axios_1 = __importDefault(require("axios"));
var dotenv_flow_1 = require("dotenv-flow");
var discord_webhook_node_1 = require("discord-webhook-node");
(0, dotenv_flow_1.config)();
var etag = '';
if (fs.existsSync('.etag')) {
    etag = fs.readFileSync('.etag').toString();
}
axios_1.default.get('https://esi.evetech.net/v2/universe/system_kills/', { headers: { 'If-None-Match': etag } }).then(function (response) { return __awaiter(void 0, void 0, void 0, function () {
    var oldData, newData, systems, data, _loop_1, i, hook, embed, ids, i, dat, limitedIds, deltaSystemIds, i, idData, text, data1Sorted, _loop_2, i, limitedIds2, deltaSystemIds2, i, text2, data2Sorted, _loop_3, i, hookLimited, embedLimited, tmp, _loop_4, i;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                oldData = null;
                newData = response.data;
                if (fs.existsSync('history.json')) {
                    oldData = JSON.parse(fs.readFileSync('history.json').toString());
                }
                systems = process.env.DELTA_SYSTEM_IDS.split(',')
                    .concat(process.env.DELTA_SYSTEM_IDS.split(','))
                    .concat(process.env.KILL_SYSTEM_IDS.split(','));
                systems = Array.from(new Set(systems));
                data = [];
                _loop_1 = function (i) {
                    var system = parseInt(systems[i]);
                    var oldSystemData = 0;
                    if (oldData) {
                        var tmp_1 = oldData.find(function (e) { return e.system_id === system; });
                        if (typeof tmp_1 !== "undefined") {
                            // @ts-ignore prevented by typeof check
                            oldSystemData = tmp_1.npc_kills;
                        }
                    }
                    var tmp_2 = newData.find(function (e) { return e.system_id === system; });
                    var newSystemData = 0;
                    if (typeof tmp_2 !== "undefined") {
                        // @ts-ignore prevented by typeof check
                        newSystemData = tmp_2.npc_kills;
                    }
                    var delta = (newSystemData - oldSystemData);
                    data.push({ id: system, npc_kills: newSystemData, delta: delta });
                };
                for (i = 0; i < systems.length; i++) {
                    _loop_1(i);
                }
                // Store data
                fs.rmSync('history.json');
                fs.writeFileSync('history.json', JSON.stringify(response.data));
                fs.writeFileSync('.etag', response.headers.etag);
                hook = new discord_webhook_node_1.Webhook(process.env.DELTA_WEBHOOK);
                embed = new discord_webhook_node_1.MessageBuilder()
                    .setTitle('NPC Delta Report')
                    .setFooter(response.headers["last-modified"]);
                ids = [];
                for (i = 0; i < data.length; i++) {
                    dat = data[i];
                    ids.push(dat.id);
                }
                limitedIds = process.env.DELTA_SYSTEM_IDS.split(',');
                deltaSystemIds = [];
                for (i = 0; i < limitedIds.length; i++) {
                    deltaSystemIds.push(parseInt(limitedIds[i]));
                }
                ids = Array.from(new Set(ids));
                return [4 /*yield*/, axios_1.default.post('https://esi.evetech.net/v3/universe/names/', ids)];
            case 1:
                idData = (_a.sent()).data;
                text = '```diff';
                data1Sorted = data.sort(function (a, b) {
                    if (a.delta < b.delta) {
                        return 1;
                    }
                    else if (a.delta > b.delta) {
                        return -1;
                    }
                    return 0;
                });
                _loop_2 = function (i) {
                    var dat = data1Sorted[i];
                    if (!deltaSystemIds.includes(dat.id))
                        return "continue";
                    if (dat.delta <= 0)
                        return "continue";
                    var delta = dat.delta.toString();
                    var prefix = '-';
                    if (!delta.startsWith("-")) {
                        delta = "+".concat(delta);
                        if (dat.delta == 0) {
                            prefix = ' ';
                        }
                        else {
                            prefix = '+';
                        }
                    }
                    text = "".concat(text, "\n").concat(prefix, " ").concat((idData.find(function (e) { return e.id === dat.id; }).name), " => ").concat(dat.npc_kills.toString().padStart(4, ' '), " (").concat(delta.toString().padStart(4, ' '), ")");
                };
                for (i = 0; i < data1Sorted.length; i++) {
                    _loop_2(i);
                }
                text = "".concat(text, "```");
                if (text === '```diff```') {
                    text = 'No positive deltas!';
                }
                embed.setDescription(text);
                hook.send(embed);
                limitedIds2 = process.env.DELTA_SYSTEM_IDS2.split(',');
                deltaSystemIds2 = [];
                for (i = 0; i < limitedIds.length; i++) {
                    deltaSystemIds2.push(parseInt(limitedIds2[i]));
                }
                text2 = '```diff';
                data2Sorted = data.sort(function (a, b) {
                    if (a.delta < b.delta) {
                        return 1;
                    }
                    else if (a.delta > b.delta) {
                        return -1;
                    }
                    return 0;
                });
                _loop_3 = function (i) {
                    var dat = data2Sorted[i];
                    if (!deltaSystemIds2.includes(dat.id))
                        return "continue";
                    if (dat.delta <= 0)
                        return "continue";
                    var delta = dat.delta.toString();
                    var prefix = '-';
                    if (!delta.startsWith("-")) {
                        delta = "+".concat(delta);
                        if (dat.delta == 0) {
                            prefix = ' ';
                        }
                        else {
                            prefix = '+';
                        }
                    }
                    text2 = "".concat(text2, "\n").concat(prefix, " ").concat((idData.find(function (e) { return e.id === dat.id; }).name), " => ").concat(dat.npc_kills.toString().padStart(4, ' '), " (").concat(delta.toString().padStart(4, ' '), ")");
                };
                for (i = 0; i < data2Sorted.length; i++) {
                    _loop_3(i);
                }
                text2 = "".concat(text2, "```");
                if (text2 === '```diff```') {
                    text2 = 'No positive deltas!';
                }
                embed.setDescription(text2);
                hook.send(embed);
                hookLimited = new discord_webhook_node_1.Webhook(process.env.KILL_WEBHOOK);
                embedLimited = new discord_webhook_node_1.MessageBuilder()
                    .setTitle('NPC Kill Report')
                    .setFooter(response.headers["last-modified"]);
                tmp = newData.filter(function (e) { return ids.includes(e.system_id) && e.npc_kills >= parseInt(process.env.KILL_LIMIT); });
                text = "```";
                tmp = tmp.sort(function (a, b) {
                    if (a.npc_kills < b.npc_kills) {
                        return 1;
                    }
                    else if (a.npc_kills > b.npc_kills) {
                        return -1;
                    }
                    return 0;
                });
                _loop_4 = function (i) {
                    var system = tmp[i];
                    text = "".concat(text, "\n ").concat((idData.find(function (e) { return e.id === system.system_id; }).name), " => ").concat(system.npc_kills.toString().padStart(4, ' '));
                };
                for (i = 0; i < tmp.length; i++) {
                    _loop_4(i);
                }
                text = "".concat(text, "```");
                embedLimited.setDescription(text);
                hookLimited.send(embedLimited);
                return [2 /*return*/];
        }
    });
}); }).catch(function (response) {
    if (response.status === 304) {
        return;
    }
});
