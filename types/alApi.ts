export interface Saying {
    content: string;
    author: string;
    typeid: number;
}

export interface SayingResource {
    request_id: string;
    success: boolean;
    message: string;
    code: number;
    data: Saying;
    time: number;
    usage: number;
}