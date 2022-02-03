import * as fs from "fs"
import axios from 'axios'
import {config} from 'dotenv-flow'
import {MessageBuilder, Webhook} from "discord-webhook-node"

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
    const systems = (process.env.SYSTEM_IDS as string).split(',')

    let data = []
    for (let i = 0; i < systems.length; i++) {
        const system = parseInt(systems[i])
        let oldSystemData: number = 0
        if (oldData) {
            let tmp: { npc_kills: number, pod_kills: number, ship_kills: number, system_id: number }|undefined = oldData.find((e: { npc_kills: number, pod_kills: number, ship_kills: number, system_id: number }) => e.system_id === system)
            if (typeof tmp !== "undefined") {
                // @ts-ignore prevented by typeof check
                oldSystemData = tmp.npc_kills
            }
        }
        let tmp: { npc_kills: number, pod_kills: number, ship_kills: number, system_id: number }|undefined = newData.find((e: { npc_kills: number, pod_kills: number, ship_kills: number, system_id: number }) => e.system_id === system)
        let newSystemData = 0
        if (typeof tmp !== "undefined") {
            // @ts-ignore prevented by typeof check
            newSystemData = tmp.npc_kills
        }
        const delta = (newSystemData - oldSystemData)
        data.push({id: system, npc_kills: newSystemData, delta: delta})
    }

    fs.rmSync('history.json')
    fs.writeFileSync('history.json', JSON.stringify(response.data))
    fs.writeFileSync('.etag', response.headers.etag)
    const hook = new Webhook(process.env.WEBHOOK as string)
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
        let delta = dat.delta.toString()
        if (!delta.startsWith("-")) {
            delta = `+${delta}`
        }
        embed.addField(idData.find((e: any) => e.id === dat.id).name, `${dat.npc_kills} (${delta})`,true)
    }
    hook.send(embed)
}).catch(response => {
    if (response.status === 304) {
        return
    }
})