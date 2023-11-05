/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "AlwaysSuperReact",
    description: "Makes super reactions enabled by default on emoji picker",
    authors: [Devs.mantikafasi],

    patches: [
        {
            find: "trackEmojiSearchResultsViewed,200",
            replacement: {
                match: /(useBurstReactionsExperiment\)\(.{1,3}\)),(\[.{1,3},.{1,3}\])=(.)\.useState\(!1\)/,
                replace: "$1,$2=$3.useState(true)"
            }
        }
    ],
});
