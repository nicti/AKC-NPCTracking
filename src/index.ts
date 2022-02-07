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
        .setTitle('NPC Delta Report')
        .setFooter(response.headers["last-modified"])
    let ids = []
    for (let i = 0; i < data.length; i++) {
        let dat = data[i]
        ids.push(dat.id)
    }
    const limitedIds = (process.env.SYSTEM_IDS_LIMITED as string).split(',')
    for (let i = 0; i < limitedIds.length; i++) {
        ids.push(parseInt(limitedIds[i]))
    }
    ids = Array.from(new Set(ids))
    let idData = (await axios.post('https://esi.evetech.net/v3/universe/names/',ids)).data

    let text = '```diff'
    for (let i = 0; i < data.length; i++) {
        let dat = data[i]
        let delta = dat.delta.toString()
        let prefix = '-'
        if (!delta.startsWith("-")) {
            delta = `+${delta}`
            if (dat.delta == 0) {
                prefix = ' '
            } else {
                prefix = '+'
            }
        }
        text = `${text}\n${prefix} ${(idData.find((e: any) => e.id === dat.id).name)} => ${dat.npc_kills.toString().padStart(4,' ')} (${delta.toString().padStart(4,' ')})`
    }
    text = `${text}\`\`\``
    embed.setDescription(text)
    hook.send(embed)

    const hookLimited = new Webhook(process.env.WEBHOOK_LIMITER as string)
    const embedLimited = new MessageBuilder()
        .setTitle('NPC Kill Report')
        .setFooter(response.headers["last-modified"])

    let tmp: { npc_kills: number, pod_kills: number, ship_kills: number, system_id: number }[]|undefined = newData.filter((e: { npc_kills: number, pod_kills: number, ship_kills: number, system_id: number }) => limitedIds.includes(e.system_id.toString()) && e.npc_kills >= parseInt(process.env.LIMITER_LIMIT as string))
    text = "```"
    for (let i = 0; i < tmp.length; i++) {
        let system: { npc_kills: number, pod_kills: number, ship_kills: number, system_id: number } = tmp[i]
        text = `${text}\n ${(idData.find((e: any) => e.id === system.system_id).name)} => ${system.npc_kills.toString().padStart(4,' ')}`
    }
    text = `${text}\`\`\``
    embedLimited.setDescription(text)
    hookLimited.send(embedLimited)

}).catch(response => {
    if (response.status === 304) {
        return
    }
})