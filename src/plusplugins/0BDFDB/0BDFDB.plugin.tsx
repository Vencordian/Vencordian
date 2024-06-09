/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { disableStyle, enableStyle } from "@api/Styles";
import definePlugin, { OptionType } from "@utils/types";
import { Text } from "@webpack/common";

import loaderCss from "./loader.css?managed";

let loaded = false;

const loaderElem = document.createElement("div");
loaderElem.id = "bd-loading-icon";
loaderElem.className = "bd-loaderv2";
loaderElem.title = "BetterDiscord is loading...";

function load() {
    loaderElem.remove();
    disableStyle(loaderCss);
}

const settings = definePluginSettings({
    loader: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Show the BetterDiscord loading icon",
    },
    _: {
        type: OptionType.COMPONENT,
        description: "",
        component: () => (
            <>
                <Text>0BDFDB</Text>
                <Text>This plugin is "required" as a joke</Text>
                <Text>All this plugin does is show the betterdiscord loading icon</Text>
                <Text>If you dont like it, disable the setting above</Text>
            </>
        )
    }
});

export default definePlugin({
    name: "BDFDB",
    description: "Required library for DevilBro's plugins.",
    authors: [{
        name: "DevilBro",
        id: 278543574059057154n
    }],

    enabledByDefault: true,
    required: true,

    settings,

    loaderElem: document.createElement("div"),


    flux: {
        LOAD_MESSAGES_SUCCESS: () => {
            if (loaded) return;
            loaded = true;
            load();
        },
    },
    start() {
        if (settings.store.loader) {
            enableStyle(loaderCss);
            document.body.appendChild(loaderElem);
        }
    },

    stop() {
        load();
    }
});
