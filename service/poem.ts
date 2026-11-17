"use server";
import {env} from "env.mjs";
import { Request } from "@/lib/http";
import type {Poem, PoemResponse} from "@/types/Poem";

const baseUrl = env.POEM_API_URL.replace(/\/+$/, "");
const http = new Request({
    baseUrl,
    method: "GET",
    headers: {"Content-Type": "application/json"},
});

type DisplayPoemResponse = {data: Pick<Poem, "content" | "origin">};
type LegacyPoemResponse = {content: string; origin: string; author: string};

export async function getPoemToken() {
    return await http.get<{data: string}>("/token", {
        signal: AbortSignal.timeout(5000),
        next: {revalidate: 86400},
    });
}

export async function getTodayPoem(): Promise<DisplayPoemResponse | null> {
    try {
        // 旧版接口支持服务端调用，返回一句诗及其标题、作者。
        if (new URL(baseUrl).hostname === "v1.jinrishici.com") {
            const poem = await http.get<LegacyPoemResponse>("/all.json", {
                signal: AbortSignal.timeout(5000),
                next: {revalidate: 44640},
            });
            if (!poem || typeof poem.content !== "string" || typeof poem.origin !== "string" || typeof poem.author !== "string") return null;
            return {
                data: {
                    content: poem.content,
                    origin: {title: poem.origin, author: poem.author, dynasty: "", content: [poem.content]},
                },
            };
        }

        const tokenRes = await getPoemToken();
        if (typeof tokenRes?.data !== "string" || !tokenRes.data) return null;
        const response = await http.get<PoemResponse>("/sentence", {
            headers: {"X-User-Token": tokenRes.data},
            signal: AbortSignal.timeout(5000),
            next: {revalidate: 44640},
        });
        if (response?.status !== "success" || !response.data?.origin || !Array.isArray(response.data.origin.content)) return null;
        return response;
    } catch {
        return null;
    }
}
