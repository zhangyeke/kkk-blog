export interface PoemData {
    title: string;
    dynasty: string;
    author: string;
    content: string[];
}

export interface Poem {
    id: string;
    content: string;
    popularity: number;
    origin: PoemData;
    matchTags: string[];
    recommendedReason: string;
    cacheAt: string;
}

export interface PoemResponse {
    status: string;
    data: Poem;
    token: string;
    ipAddress: string;
}