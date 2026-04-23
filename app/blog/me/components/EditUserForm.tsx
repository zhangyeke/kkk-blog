"use client"
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import React, {ChangeEvent, useCallback, useMemo, useState} from "react"
import {toast} from "sonner";
import {env} from "env.mjs"
import {updateUserSchema} from "@/validators/user";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    Form as ShadForm,
} from "@/components/ui/form"
import {Input} from "@/components/ui/input";
import {DatePicker, FixSpin, Image} from "@/components/k-view"
import {Button} from "@/components/ui/button";
import {uploadImagePromise} from "@/lib/utils";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {updateAuth} from "@/service/auth";
import {useRouter} from "next/navigation";


type UpdateUserSchema = z.infer<typeof updateUserSchema>


interface EditUserFormProps extends BaseComponentProps {
    defaultValues?: Partial<UpdateUserSchema>
}

export default function EditUserForm(props: EditUserFormProps) {
    const {defaultValues} = props;
    const router = useRouter();

    const [pending, setPending] = useState(false)
    const [uploadPending, setUploadPending] = useState(false)


    const form = useForm<UpdateUserSchema>({
        resolver: zodResolver(updateUserSchema),
        defaultValues,
    })

    const watchValues = useMemo(() => form.getValues(), [form.getValues])


    const onSubmit = useCallback(async (data: UpdateUserSchema) => {
        try {
            setPending(true)
            await updateAuth(data)
            router.refresh();
            toast.success('保存成功')
        } catch {
            toast.error('保存失败')
        } finally {
            setPending(false)
        }
    }, [])

    const handleFileChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>, onChange: (t: { target: { value: string } }) => void) => {
            const file = event.target.files?.[0];
            if (file) {
                setUploadPending(true)
                uploadImagePromise(file).then(url => {
                    onChange({
                        target: {
                            value: url
                        }
                    })
                }).finally(() => {
                    setUploadPending(false)
                })

            }
        }, [setUploadPending])

    const handleRandomAvatar = useCallback(async (onChange: (t: { target: { value: string } }) => void) => {
        try {
            setUploadPending(true)
            const res = await fetch(`${env.NEXT_PUBLIC_RANDOM_IMAGE_URL_2}/pp/`)
            onChange({
                target: {
                    value: res.url
                }
            })

        } catch {
            toast.success('生成失败请稍后重试')
        } finally {
            setUploadPending(false)
        }

    }, [])


    return (
        <ShadForm {...form} >
            <form className="space-y-4 px-6" onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                    control={form.control}
                    name={'avatar'}
                    render={({field}) => {
                        return (
                            <FormItem className={'flex items-center flex-col'}>
                                <FormControl>
                                    <div
                                        className={'group relative overflow-hidden border border-solid border-input rounded-full '}
                                    >
                                        <div
                                            className={'group-hover:translate-y-0 transform transition-transform duration-500 ease-in-out translate-y-full absolute bottom-0 left-0 cursor-pointer w-full z-100 bg-primary text-white text-xs text-center pt-1 pb-3'}
                                            onClick={() => handleRandomAvatar(field.onChange)}
                                        >
                                            随机动漫头像
                                        </div>
                                        <Image
                                            className={'size-30 rounded-full'}
                                            src={field.value}
                                            fallback={watchValues.name.substring(0, 1)}
                                        />
                                        <input
                                            className={'absolute inset-0 z-10 opacity-0 cursor-pointer'}
                                            type={'file'}
                                            accept={'image/*'}
                                            onChange={(e) => handleFileChange(e, field.onChange)}
                                        />
                                        {uploadPending && <FixSpin/>}
                                    </div>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )
                    }}
                />

                <FormField
                    control={form.control}
                    name={'name'}
                    render={({field}) => {
                        return (
                            <FormItem>
                                <div className={'flex items-center'}>
                                    <FormLabel>昵称：</FormLabel>
                                    <FormControl className={'flex-1'}>
                                        <Input {...field} />
                                    </FormControl>
                                </div>
                                <FormMessage/>
                            </FormItem>
                        )
                    }}
                />
                <FormField
                    control={form.control}
                    name={'email'}
                    render={({field}) => {
                        return (
                            <FormItem>
                                <div className={'flex items-center'}>
                                    < FormLabel> 邮箱：</FormLabel>
                                    <FormControl className={'flex-1'}>
                                        <span className={'text-gray-500'}>{field.value}</span>
                                    </FormControl>
                                </div>
                                <FormMessage/>
                            </FormItem>
                        )
                    }}
                />
                <FormField
                    control={form.control}
                    name={'gender'}
                    render={({field}) => {
                        return (
                            <FormItem>
                                <div className={'flex items-center'}>
                                    <FormLabel>性别：</FormLabel>
                                    <FormControl className={'flex-1'}>
                                        <RadioGroup
                                            defaultValue={String(field.value)}
                                            className="w-fit flex items-center gap-x-2"
                                            onChange={field.onChange}
                                        >

                                            <div className="flex items-center gap-3">
                                                <RadioGroupItem value="1" id='1'/>
                                                <FormLabel htmlFor="1">男</FormLabel>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <RadioGroupItem value="0" id='0'/>
                                                <FormLabel htmlFor="0">女</FormLabel>
                                            </div>
                                        </RadioGroup>
                                    </FormControl>

                                </div>

                                <FormMessage/>
                            </FormItem>
                        )
                    }}
                />

                <FormField
                    control={form.control}
                    name={'birthday'}
                    render={({field}) => {
                        return (
                            <FormItem>
                                <div className={'flex items-center'}>
                                    <FormLabel>出生日期：</FormLabel>
                                    <FormControl>
                                        <DatePicker
                                            className={'w-fit'}
                                            value={field.value}
                                            placeholder={'请选择出生日期'}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                </div>
                                <FormMessage/>
                            </FormItem>
                        )
                    }}
                />


                <div className={'mx-auto lg:w-1/4 mt-4'}>
                    <Button long={true} size={'lg'} loading={pending}>保存</Button>
                </div>
            </form>
        </ShadForm>
    )
}
