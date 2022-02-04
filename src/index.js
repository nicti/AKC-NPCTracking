"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
dotenv_flow_1.config();
var etag = '';
if (fs.existsSync('.etag')) {
    etag = fs.readFileSync('.etag').toString();
}
axios_1.default.get('https://esi.evetech.net/v2/universe/system_kills/', { headers: { 'If-None-Match': etag } }).then(function (response) { return __awaiter(void 0, void 0, void 0, function () {
    var oldData, newData, systems, data, _loop_1, i, hook, embed, ids, i, dat, idData, text, _loop_2, i;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                oldData = null;
                newData = response.data;
                if (fs.existsSync('history.json')) {
                    oldData = JSON.parse(fs.readFileSync('history.json').toString());
                }
                systems = process.env.SYSTEM_IDS.split(',');
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
                    var tmp = newData.find(function (e) { return e.system_id === system; });
                    var newSystemData = 0;
                    if (typeof tmp !== "undefined") {
                        // @ts-ignore prevented by typeof check
                        newSystemData = tmp.npc_kills;
                    }
                    var delta = (newSystemData - oldSystemData);
                    data.push({ id: system, npc_kills: newSystemData, delta: delta });
                };
                for (i = 0; i < systems.length; i++) {
                    _loop_1(i);
                }
                fs.rmSync('history.json');
                fs.writeFileSync('history.json', JSON.stringify(response.data));
                fs.writeFileSync('.etag', response.headers.etag);
                hook = new discord_webhook_node_1.Webhook(process.env.WEBHOOK);
                embed = new discord_webhook_node_1.MessageBuilder()
                    .setTitle('NPC Kill Report')
                    .setFooter(response.headers["last-modified"]);
                ids = [];
                for (i = 0; i < data.length; i++) {
                    dat = data[i];
                    ids.push(dat.id);
                }
                return [4 /*yield*/, axios_1.default.post('https://esi.evetech.net/v3/universe/names/', ids)];
            case 1:
                idData = (_a.sent()).data;
                text = '```diff';
                _loop_2 = function (i) {
                    var dat = data[i];
                    var delta = dat.delta.toString();
                    var prefix = '-';
                    if (!delta.startsWith("-")) {
                        delta = "+" + delta;
                        if (dat.delta == 0) {
                            prefix = ' ';
                        }
                        else {
                            prefix = '+';
                        }
                    }
                    text = text + "\n" + prefix + " " + (idData.find(function (e) { return e.id === dat.id; }).name) + " => " + dat.npc_kills.toString().padStart(4, ' ') + " (" + delta.toString().padStart(4, ' ') + ")";
                };
                for (i = 0; i < data.length; i++) {
                    _loop_2(i);
                }
                text = text + "```";
                embed.setDescription(text);
                hook.send(embed);
                return [2 /*return*/];
        }
    });
}); }).catch(function (response) {
    if (response.status === 304) {
        return;
    }
});
