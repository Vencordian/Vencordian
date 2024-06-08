/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType } from "@api/Commands";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";

const MessageCreator = findByPropsLazy("getSendMessageOptionsForReply", "sendMessage");
const PendingReplyStore = findByPropsLazy("getPendingReply");
export default definePlugin({
    name: "Shiggy",
    description: "Generate kemomimichan images",
    authors: [Devs.ImLvna],

    dependencies: ["CommandsAPI"],

    commands: [
        {
            name: "shiggy",
            description: "Generates a random kemomimi-chan!",
            inputType: ApplicationCommandInputType.BOT,
            execute: async (_, ctx) => {
                const shiggy = await fetch("https://shiggy.fun/api/v3/random").then(r => r.headers.get("Shiggy-Id"));

                const reply = PendingReplyStore.getPendingReply(ctx.channel.id);
                MessageCreator.sendMessage(ctx.channel.id, {
                    // The following are required to prevent Discord from throwing an error
                    invalidEmojis: [],
                    tts: false,
                    validNonShortcutEmojis: [],
                    content: `https://shiggy.fun/api/v3/shiggies/${shiggy}`
                }, void 0, MessageCreator.getSendMessageOptionsForReply(reply));
            }
        }
    ]
});
