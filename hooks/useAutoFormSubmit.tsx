import React, {startTransition, useActionState, useCallback, useEffect} from "react";
import {toast} from "sonner";
import {FormInstance} from "@/components/k-view";
import {FieldValues} from "react-hook-form";

/*
 * @Author: kkk
 * @Date: 2026/3/25
 * @LastEditors: kkk
 * @Description: autoForm组件自定义提交
 * @Params:
 */
type Action<P, T> = (params: P) => Promise<BaseResource<T>>

async function actionFunctionWrapper<Data, Params, T>(_: Data, params: Params, action: Action<Params, T>) {
    return await action(params)
}

type SubmitOptions = {
    isResetForm?: boolean
    submitSuccessAction?: <Res>(res: BaseResource<Res>, form: (FormInstance | null)) => void
    submitFailAction?: <Res>(res: BaseResource<Res>, form: (FormInstance | null)) => void
}

export function useCustomFormSubmit<P, T>(action: Action<P, T>, options?: SubmitOptions) {
    const formInstance = React.useRef<FormInstance>(null)
    const isFinish = React.useRef(false) // 请求是否完毕 避免每次回页面 由于resData已经存在 每次useEffect都会执行
    const [resData, trigger, pending] = useActionState((state, payload) => actionFunctionWrapper(state, payload, action), null)


    const onSubmit = useCallback((params?: FieldValues) => {
        isFinish.current = false
        formInstance.current?.handleSubmit(values => {
            startTransition(() => trigger({...values, ...params}))
        })()
    }, [trigger])

    useEffect(() => {
        if (resData && !isFinish.current) {
            const {code, message} = resData
            if (code === 200) {
                isFinish.current = true
                if (options?.isResetForm) {
                    formInstance.current?.reset()
                }
                options?.submitSuccessAction?.(resData, formInstance.current)
            } else {
                if (options?.submitFailAction) {
                    options.submitFailAction(resData, formInstance.current)
                } else {
                    toast.error(message || "操作失败")
                }
            }
        }
    }, [resData, options]);

    return {
        formInstance,
        resData,
        pending,
        onSubmit
    }
}


/*暂时弃用:autoform初始化拿到的form实例无法触发校验*/

/*
export function useAutoFormCustomSubmit<P, T>(action: Action<P, T>, submitAfterAction?: (form: (FormInstance | null)) => void) {
    const formInstance = useRef<FormInstance>(null)

    const [resData, trigger, pending] = useActionState((state, payload) => actionFunctionWrapper(state, payload, action), null)

    const onFormInit = (form: FormInstance) => {
        formInstance.current = form as UseFormReturn
    }

    const onSubmit = useCallback(async () => {
        const form = formInstance.current
        console.log("点击提交", form?.getValues())
        if (formInstance.current) {
            // 1. 手动触发所有字段校验
            const isValid = await formInstance.current.trigger();
            console.log(isValid, "校验结果")
            await formInstance.current.handleSubmit((values) => {
                console.log("提交了什么", values)
                // startTransition(() => trigger(values))
                // submitAfterAction?.(formInstance.current)
            })()
        }
    }, [trigger, submitAfterAction])


    return {
        formInstance,
        pending,
        resData,
        onFormInit,
        onSubmit
    }
}

*/

