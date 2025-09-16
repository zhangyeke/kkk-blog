"use client"
import {useRouter} from "next/navigation";
import {useState} from "react";
import {useAppStore} from "@/hooks";
import {ColorBox, ColorPicker, Drawer} from "@/components/k-view";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"

export default function SettingPage() {
    const router = useRouter()
    const [open, setOpen] = useState(true)
    const {themes, updateThemes} = useAppStore(
        (state) => state,
    )


    function handleOpenChange(open: boolean = false) {
        setOpen(open)
        !open && router.back()
    }

    function handlePrimaryColorConfirm(color: string) {
        updateThemes(color, 'primary')
    }


    return (
        <Drawer
            title={'设置'}
            footer={null}
            open={open}
            direction={'right'}
            aria-hidden={open}
            onOpenChange={handleOpenChange}
        >

            <div className={'p-3'}>
                <Popover>
                    <PopoverTrigger asChild>
                        <div className={'flex items-center'}>
                            <span>主题颜色：</span>
                            <ColorBox  color={themes.primary}/>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className={'z-[101] border-0  w-fit p-0'}>
                        <ColorPicker defaultValue={themes.primary} onChangeComplete={handlePrimaryColorConfirm}/>
                    </PopoverContent>
                </Popover>
            </div>

        </Drawer>
    )
}
