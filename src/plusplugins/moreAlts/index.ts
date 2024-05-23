import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
const settings = definePluginSettings({
    amtOfAcounts: {
        default: 10,
        type: OptionType.NUMBER,
        description: "Amount of alts to allow."
    },
});

export default definePlugin({
    name: "MoreAlts",
    description: "Allows you to have more alts in the account switcher.",
    authors: [
        {
            id: 253302259696271360n,
            name: "zastix",
        },
    ],
    settings,
    patches: [
        {
            find: "MAX_ACCOUNTS:",
            replacement: [{
                match: /MAX_ACCOUNTS:function\(\){return .{1,2}\}/,
                replace: `MAX_ACCOUNTS:function(){return $self.settings.amtOfAcounts}`
            }]
        }
    ]
});
