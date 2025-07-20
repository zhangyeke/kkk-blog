// lib/api-utils.ts
import {NextRequest, NextResponse} from 'next/server';

// 定义我们 API Handler 的标准函数签名
type ApiHandler = (request: NextRequest) => Promise<unknown>;

// 这就是我们的高阶函数封装器
export function withResponseHandler(handler: ApiHandler): ApiHandler {

    return async (request: NextRequest) => {
        try {
            // 直接调用并返回原始 handler 的成功响应
            const data = await handler(request);

            return NextResponse.json({
                code: 200,
                message: 'success',
                data,
            });
        } catch (error: unknown) {
            // 在这里进行统一的错误处理
            console.error('API Route Error:', error);
            // 您可以根据错误的类型返回不同的状态码
            // 例如，如果是自定义的权限错误
            // if (error instanceof AuthorizationError) {
            //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            // }

            // 默认返回 500 内部服务器错误
            return NextResponse.json(
                {error: error || 'An unexpected error occurred', code: 500, message: 'fail',},
            );
        }
    };
}