/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs, EquicordDevs } from "@utils/constants";
import { humanFriendlyJoin } from "@utils/text";
import definePlugin, { OptionType } from "@utils/types";
import { findByCodeLazy, findByPropsLazy } from "@webpack";
import { ChannelStore, FluxDispatcher, MessageActions, MessageStore, RelationshipStore, SelectedChannelStore, UserStore } from "@webpack/common";
import { Message, User } from "discord-types/general";

const createBotMessage = findByCodeLazy('username:"Clyde"');
const SortedVoiceStateStore = findByPropsLazy("getVoiceStatesForChannel", "getCurrentClientVoiceChannelId");

const settings = definePluginSettings({
    friendDirectMessages: {
        type: OptionType.BOOLEAN,
        description: "Receive notifications in your friends' DMs when they join a voice channel",
        default: true
    },
    friendDirectMessagesShowMembers: {
        type: OptionType.BOOLEAN,
        description: "Show a list of other members in the voice channel when receiving a DM notification of your friend joining a voice channel",
        default: true
    },
    friendDirectMessagesShowMemberCount: {
        type: OptionType.BOOLEAN,
        description: "Show the count of other members in the voice channel when receiving a DM notification of your friend joining a voice channel",
        default: false
    },
    friendDirectMessagesSelf: {
        type: OptionType.BOOLEAN,
        description: "Receive notifications in your friends' DMs, even if you are in the same voice channel as them",
        default: false
    },
    friendDirectMessagesSilent: {
        type: OptionType.BOOLEAN,
        description: "Join messages in your friends' DMs will be silent",
        default: false
    },
    allowedFriends: {
        type: OptionType.STRING,
        description: "Comma or space separated list of friends' user IDs you want to receive join messages from",
        default: ""
    },
    ignoreBlockedUsers: {
        type: OptionType.BOOLEAN,
        description: "Do not send messages about blocked users joining voice channels",
        default: true
    },
});

interface VoiceState {
    guildId?: string;
    channelId?: string;
    oldChannelId?: string;
    user: User;
    userId: string;
}

function getMessageFlags() {
    let flags = 1 << 6;
    if (settings.store.friendDirectMessagesSilent) flags += 1 << 12;
    return flags;
}

function sendVoiceStatusMessage(channelId: string, content: string, userId: string): Message | null {
    if (!channelId) return null;
    const message: Message = createBotMessage({ channelId, content, embeds: [] });
    message.flags = getMessageFlags();
    message.author = UserStore.getUser(userId);
    // If we try to send a message into an unloaded channel, the client-sided messages get overwritten when the channel gets loaded
    // This might be messy but It Works:tm:
    const messagesLoaded: Promise<any> = MessageStore.hasPresent(channelId) ? new Promise<void>(r => r()) : MessageActions.fetchMessages({ channelId });
    messagesLoaded.then(() => {
        FluxDispatcher.dispatch({
            type: "MESSAGE_CREATE",
            channelId,
            message,
            optimistic: true,
            sendMessageOptions: {},
            isPushNotification: false
        });
    });
    return message;
}

function isFriendAllowlisted(friendId: string) {
    if (!RelationshipStore.isFriend(friendId)) return false;
    const list = settings.store.allowedFriends.split(",").join(" ").split(" ").filter(i => i.length > 0);
    if (list.join(" ").length < 1) return true;
    return list.includes(friendId);
}

// Blatantly stolen from VcNarrator plugin

// For every user, channelId and oldChannelId will differ when moving channel.
// Only for the local user, channelId and oldChannelId will be the same when moving channel,
// for some ungodly reason
let clientOldChannelId: string | undefined;

export default definePlugin({
    name: "VoiceJoinMessages",
    description: "Receive client-side ephemeral messages when your friends join voice channels",
    authors: [Devs.Sqaaakoi, EquicordDevs.thororen],
    settings,
    flux: {
        VOICE_STATE_UPDATES({ voiceStates }: { voiceStates: VoiceState[]; }) {
            const clientUserId = UserStore.getCurrentUser().id;
            for (const state of voiceStates) {
                // mmmm hacky workaround
                const { userId, channelId } = state;
                let { oldChannelId } = state;
                if (userId === clientUserId && channelId !== clientOldChannelId) {
                    oldChannelId = clientOldChannelId;
                    clientOldChannelId = channelId;
                }
                if (settings.store.ignoreBlockedUsers && RelationshipStore.isBlocked(userId)) return;
                // Ignore events from same channel
                if (oldChannelId === channelId) return;

                // Friend joined a voice channel
                if (settings.store.friendDirectMessages && (!oldChannelId && channelId) && userId !== clientUserId && isFriendAllowlisted(userId)) {
                    const selfInChannel = SelectedChannelStore.getVoiceChannelId() === channelId;
                    let memberListContent = "";
                    if (settings.store.friendDirectMessagesShowMembers || settings.store.friendDirectMessagesShowMemberCount) {
                        const voiceState = SortedVoiceStateStore.getVoiceStatesForChannel(channelId);
                        const sortedVoiceStates: User[] = Object.values(voiceState as { [key: string]: VoiceState; })
                            .filter((voiceState: VoiceState) => { voiceState.user && voiceState.user.id !== userId; })
                            .map((voiceState: VoiceState) => voiceState.user);
                        console.log(sortedVoiceStates);
                        const otherMembers = sortedVoiceStates.filter(s => s.id !== userId);
                        const otherMembersCount = otherMembers.length;
                        if (otherMembersCount <= 0) {
                            memberListContent += ", nobody else is in the voice channel";
                        } else if (settings.store.friendDirectMessagesShowMemberCount) {
                            memberListContent += ` with ${otherMembersCount} other member${otherMembersCount === 1 ? "s" : ""}`;
                        }
                        if (settings.store.friendDirectMessagesShowMembers && otherMembersCount > 0) {
                            memberListContent += settings.store.friendDirectMessagesShowMemberCount ? ", " : " with ";
                            memberListContent += humanFriendlyJoin(otherMembers.map(s => `<@${s.id}>`));
                        }
                    }
                    const dmChannelId = ChannelStore.getDMFromUserId(userId);
                    if (dmChannelId && (selfInChannel ? settings.store.friendDirectMessagesSelf : true)) sendVoiceStatusMessage(dmChannelId, `has joined voice channel <#${channelId}>${memberListContent}`, userId);
                }
            }
        },
    },
});