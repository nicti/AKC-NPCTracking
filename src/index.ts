import * as fs from "fs"
import axios from 'axios'
import {config} from 'dotenv-flow'
import {MessageBuilder, Webhook} from "discord-webhook-node";

config()

let etag = ''

if (fs.existsSync('.etag')) {
    etag = fs.readFileSync('.etag').toString()
}

axios.get('https://esi.evetech.net/v2/universe/system_kills/', {headers: {'If-None-Match': etag}}).then(async (response) => {
    // Load old data to calculate delta
    let oldData: [] | null = null
    let newData: [] = response.data
    if (fs.existsSync('history.json')) {
        oldData = JSON.parse(fs.readFileSync('history.json').toString()) as []
    }
    const systems = process.env.SYSTEM_IDS.split(',')

    let data = []
    for (let i = 0; i < systems.length; i++) {
        const system = parseInt(systems[i])
        let oldSystemData: number = 0
        if (oldData) {
            let tmp: { npc_kills: number, pod_kills: number, ship_kills: number, system_id: number } = oldData.find((e: { npc_kills: number, pod_kills: number, ship_kills: number, system_id: number }) => e.system_id === system)
            if (typeof tmp !== "undefined") {
                oldSystemData = tmp.npc_kills
            }
        }
        let tmp: { npc_kills: number, pod_kills: number, ship_kills: number, system_id: number } = newData.find((e: { npc_kills: number, pod_kills: number, ship_kills: number, system_id: number }) => e.system_id === system)
        let newSystemData = 0
        if (typeof tmp !== "undefined") {
            newSystemData = tmp.npc_kills
        }
        const delta = (newSystemData - oldSystemData)
        data.push({id: system, npc_kills: newSystemData, delta: delta})
    }

    fs.rmSync('history.json')
    fs.writeFileSync('history.json', JSON.stringify(response.data))
    fs.writeFileSync('.etag', response.headers.etag)
    const hook = new Webhook(process.env.WEBHOOK)
    const embed = new MessageBuilder()
        .setTitle('NPC Kill Report')
        .setTimestamp()
    let ids = []
    for (let i = 0; i < data.length; i++) {
        let dat = data[i]
        ids.push(dat.id)
    }
    let idData = (await axios.post('https://esi.evetech.net/v3/universe/names/',ids)).data

    for (let i = 0; i < data.length; i++) {
        let dat = data[i]
        embed.addField(idData.find((e) => e.id === dat.id).name, `${dat.npc_kills} (${dat.delta})`,true)
    }
    hook.send(embed)
}).catch(response => {
    if (response.status === 304) {
        return
    }
})