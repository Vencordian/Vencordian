/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

declare namespace Intl {
    type Key = "calendar" | "collation" | "currency" | "numberingSystem" | "timeZone" | "unit";

    function supportedValuesOf(input: Key): string[];
}
