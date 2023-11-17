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
    let systems = (process.env.DELTA_SYSTEM_IDS as string).split(',')
        .concat((process.env.DELTA_SYSTEM_IDS as string).split(','))
        .concat((process.env.KILL_SYSTEM_IDS as string).split(','))
    systems = Array.from(new Set(systems))

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

    // Store data
    fs.rmSync('history.json')
    fs.writeFileSync('history.json', JSON.stringify(response.data))
    fs.writeFileSync('.etag', response.headers.etag)

    // Build webhooks
    // Delta Report
    const hook = new Webhook(process.env.DELTA_WEBHOOK as string)
    const embed = new MessageBuilder()
        .setTitle('NPC Delta Report')
        .setFooter(response.headers["last-modified"])
    let ids = []
    for (let i = 0; i < data.length; i++) {
        let dat = data[i]
        ids.push(dat.id)
    }
    // Delta #1
    const limitedIds = (process.env.DELTA_SYSTEM_IDS as string).split(',')
    const deltaSystemIds = [];
    for (let i = 0; i < limitedIds.length; i++) {
        deltaSystemIds.push(parseInt(limitedIds[i]))
    }
    ids = Array.from(new Set(ids))
    let idData = (await axios.post('https://esi.evetech.net/v3/universe/names/',ids)).data

    let text = '```diff'
    const data1Sorted = data.sort((a, b) => {
        if (a.delta < b.delta) {
            return -1
        } else if (a.delta > b.delta) {
            return 1
        }
        return 0
    })
    for (let i = 0; i < data1Sorted.length; i++) {
        let dat = data[i]
        if (!deltaSystemIds.includes(dat.id)) continue;
        if (dat.delta <= 0) continue;
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
    if (text === '```diff```') {
        text = 'No positive deltas!'
    }
    embed.setDescription(text)
    hook.send(embed)

    // Delta #2
    const limitedIds2 = (process.env.DELTA_SYSTEM_IDS2 as string).split(',')
    const deltaSystemIds2 = [];
    for (let i = 0; i < limitedIds.length; i++) {
        deltaSystemIds2.push(parseInt(limitedIds2[i]))
    }

    let text2 = '```diff'
    const data2Sorted = data.sort((a, b) => {
        if (a.delta < b.delta) {
            return -1
        } else if (a.delta > b.delta) {
            return 1
        }
        return 0
    })
    for (let i = 0; i < data2Sorted.length; i++) {
        let dat = data[i]
        if (!deltaSystemIds.includes(dat.id)) continue;
        if (dat.delta <= 0) continue;
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
        text2 = `${text2}\n${prefix} ${(idData.find((e: any) => e.id === dat.id).name)} => ${dat.npc_kills.toString().padStart(4,' ')} (${delta.toString().padStart(4,' ')})`
    }
    text2 = `${text2}\`\`\``
    if (text2 === '```diff```') {
        text2 = 'No positive deltas!'
    }
    embed.setDescription(text2)
    hook.send(embed)

    // Basic report
    const hookLimited = new Webhook(process.env.KILL_WEBHOOK as string)
    const embedLimited = new MessageBuilder()
        .setTitle('NPC Kill Report')
        .setFooter(response.headers["last-modified"])

    let tmp: { npc_kills: number, pod_kills: number, ship_kills: number, system_id: number }[]|undefined = newData.filter((e: { npc_kills: number, pod_kills: number, ship_kills: number, system_id: number }) => limitedIds.includes(e.system_id.toString()) && e.npc_kills >= parseInt(process.env.KILL_LIMIT as string))
    text = "```"
    tmp = tmp.sort((a, b) => {
        if (a.npc_kills < b.npc_kills) {
            return -1
        } else if (a.npc_kills > b.npc_kills) {
            return 1
        }
        return 0
    })
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