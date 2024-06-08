import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";

import Plugin from "../../plusplugins/betterMicrophone.desktop/index";
import { addSettingsPanelButton, removeSettingsPanelButton, StereoIcon } from "../../plusplugins/philsPluginLibrary";

const settings = definePluginSettings({
    downmix: {
        type: OptionType.BOOLEAN,
        description: "Default",
        default: false
    }
});

export let valueDownmix = "0";

function downmix() {
    switch (valueDownmix) {
        case "0":
            valueDownmix = "1";
            break;
        case "1":
            valueDownmix = "0";
            break;
    }

    update();
}

function update() {
    const { microphonePatcher } = Plugin;

    if (microphonePatcher)
        microphonePatcher.forceUpdateTransportationOptions();
}

export default definePlugin({
    name: "Downmix / Mono Output",
    description: "Forces Discord to downmix voice audio to mono. Useful for those pesky steweo users uwu sempai 🤮",
    dependencies: ["BetterMicrophone"],
    authors: [
        {
            id: 526331463709360141n,
            name: "desu"
        }
    ],

    settings,
    start() {
        valueDownmix = settings.store.downmix ? "0" : "1";
        addSettingsPanelButton({ name: "Downmix", icon: StereoIcon, tooltipText: "Mono Output", onClick: downmix });
        update();
    },
    stop() {
        removeSettingsPanelButton("Downmix");
        update();
    },
});
