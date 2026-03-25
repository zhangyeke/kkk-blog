import {Button} from "@/components/ui/button";
import {startTransition, useActionState, useCallback, useRef} from "react";
import {FieldValues, UseFormReturn} from "react-hook-form";

/*
 * @Author: kkk
 * @Date: 2026/3/25
 * @LastEditors: kkk
 * @Description: autoForm组件自定义提交
 * @Params:
 */
type Action<P, T> = (params: P) => Promise<T>

async function actionFunctionWrapper<Data, Params, T>(_: Data, params: Params, action: Action<Params, T>) {
    try {
        return await action(params)
    } catch (err) {
        console.error(err)
    }
}

/*暂时弃用:autoform初始化拿到的form实例无法触发校验*/
export function useAutoFormCustomSubmit<P, T>(action: Action<P, T>, submitAfterAction?: (form: (UseFormReturn | null)) => void) {
    const formInstance = useRef<UseFormReturn>(null)

    const [resData, trigger, pending] = useActionState((state, payload) => actionFunctionWrapper(state, payload, action), null)

    const onFormInit = <F extends FieldValues, >(form: UseFormReturn<F, unknown, F>) => {
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


export function useAutoFormSubmit<P, T>(action: Action<P, T>, submitAfterAction?: (form: (UseFormReturn | null)) => void) {
    const [resData, trigger, pending] = useActionState((state, payload) => actionFunctionWrapper(state, payload, action), null)


    const onSubmit = useCallback(<V extends FieldValues, >(values: V, formInstance: UseFormReturn<V, unknown, V>) => {
        // startTransition(() => trigger(values))
        console.log("清空钱", formInstance.getValues())
        formInstance.reset()
        console.log("触发清空", formInstance.getValues())

    }, [trigger])

    return {
        pending,
        onSubmit
    }
}