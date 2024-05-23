/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */


import { DataStore } from "@api/index";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher } from "@webpack/common";
import { getApplicationAsset } from "plugins/customRPC";
import { Message } from "discord-types/general";
import { UserStore } from "@webpack/common";

async function setRpc(disable?: boolean, details?: string) {

    const activity = {
        "application_id": "0",
        "name": "Today's Stats",
        "details": details ? details : "No info right now :(",
        "type": 0,
        "flags": 1,
        "assets": {
            "large_image": await getApplicationAsset(UserStore.getCurrentUser().getAvatarURL())
        }
    }
    FluxDispatcher.dispatch({
        type: "LOCAL_ACTIVITY_UPDATE",
        activity: !disable ? activity : null,
        socketId: "CustomRPC",
    });
}


function getCurrentDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getCurrentTime(): string {
    const today = new Date();
    let hour = today.getHours();
    const minute = today.getMinutes();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12

    const formattedHour = String(hour).padStart(2, '0');
    const formattedMinute = String(minute).padStart(2, '0');

    return `${formattedHour}:${formattedMinute} ${ampm}`;
}


interface IMessageCreate {
    type: "MESSAGE_CREATE";
    optimistic: boolean;
    isPushNotification: boolean;
    channelId: string;
    message: Message;
}

async function updateData()
{
    let messagesSent;
    if(await DataStore.get("RPCStatsDate") == getCurrentDate())
    {
        messagesSent = await DataStore.get("RPCStatsMessages");
    }
    else
    {
        await DataStore.set("RPCStatsDate", getCurrentDate());
        await DataStore.set("RPCStatsMessages", 0);
        messagesSent = 0;
    }
    setRpc(false, `Messages sent: ${messagesSent}`);
}

export default definePlugin({
    name: "RPCStats",
    description: "Displays stats about your current session in your rpc",
    authors: [Devs.Samwich],
    async start()
    {
        updateData();
    },
    stop()
    {
        setRpc(true);
    },
    flux: 
    {
        async MESSAGE_CREATE({ optimistic, type, message }: IMessageCreate) {
            if (optimistic || type !== "MESSAGE_CREATE") return;
            if (message.state === "SENDING") return;
            if (message.author.id != UserStore.getCurrentUser().id) return;
            await DataStore.set("RPCStatsMessages", await DataStore.get("RPCStatsMessages") + 1);
            updateData();
        },
    }
});

let lastCheckedDate: string = getCurrentDate();

function checkForNewDay(): void {
    const currentDate = getCurrentDate();
    if (currentDate !== lastCheckedDate) {
        updateData();
        lastCheckedDate = currentDate;
    }
}

setInterval(checkForNewDay, 1000 * 60); 
