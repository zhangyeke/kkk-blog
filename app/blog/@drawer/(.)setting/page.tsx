"use client"
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { produce } from 'immer';
import { useCallback, useState } from "react";
import { MonitorSmartphone, Plus, PlusIcon, Trash2 } from "lucide-react";
import { useAppStore } from "@/hooks";
import { ColorBox, ColorPicker, Drawer, Image } from "@/components/k-view";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DesktopShortcutButton } from "@/components/DesktopShortcutButton";
import { Separator } from "@/components/ui/separator"

function Cell({ className, style, children }: BaseComponentProps & ContainerProps) {
    return (
        <div style={style} className={cn('flex items-center', className)}>
            {children}
        </div>
    )
}


export default function SettingPage() {
    const router = useRouter()
    const [open, setOpen] = useState(true)
    const { themes, updateThemes, trackMouse, updateTrackMouseStatus, homeBanners, updateHomeBanners } = useAppStore(
        (state) => state,
    )

    const [banners, setBanners] = useState([...homeBanners])


    const handleDrawerClose = useCallback((nextOpen: boolean = false) => {
        setOpen(true)
        if (!nextOpen) router.back()
    }, [setOpen])

    const handlePrimaryColorConfirm = useCallback((color: string) => {
        updateThemes(color, 'primary')
    }, [])

    const handleBannerItemChange = useCallback((v: string, i: number) => {

        setBanners(produce(draft => {
            draft[i] = v
        }))
    }, [setBanners])

    const handleAddBannerItem = useCallback(() => {
        if (banners.length >= 10) return toast.info('最多设置10张图片')
        setBanners([
            ...banners,
            ''
        ])
    }, [banners, setBanners])

    const handleRemoveBannerItem = useCallback((index: number) => {
        setBanners(banners.filter((_, i) => i !== index))
    }, [banners, setBanners])


    const handleSaveHomeBanners = useCallback(() => {
        updateHomeBanners(banners.filter(Boolean))
    }, [banners])


    return (
        <Drawer
            title={'设置'}
            footer={null}
            open={open}
            direction={'right'}
            aria-hidden={open}
            onOpenChange={setOpen}
            onAnimationEnd={handleDrawerClose}
        >

            <div className="flex flex-col flex-1">
                <div className={'p-3 flex-1'}>
                    {/* 主题颜色设置 */}
                    <Popover>
                        <PopoverTrigger>
                            <Cell>
                                <span>主题颜色：</span>
                                <ColorBox color={themes.primary} />
                            </Cell>
                        </PopoverTrigger>
                        <PopoverContent className={'z-[10001] border-0  w-fit p-0 '}>
                            <ColorPicker defaultValue={themes.primary} onChangeComplete={handlePrimaryColorConfirm} />
                        </PopoverContent>
                    </Popover>

                    <Cell className={'mt-2'}>
                        <span>鼠标轨迹动画：</span>
                        <Switch className={'cursor-pointer'} checked={trackMouse} onCheckedChange={updateTrackMouseStatus} />
                    </Cell>

                    {/* 轮播图设置 */}
                    <Popover>
                        <PopoverTrigger>
                            <Cell className={'mt-2'}>
                                <span>首页轮播图：</span>
                                <AvatarGroup>
                                    {
                                        homeBanners.map((url, i) => (
                                            <Image src={url} key={i} className={'rounded-full'} />
                                        ))
                                    }
                                    <AvatarGroupCount>
                                        <PlusIcon className={'cursor-pointer'} />
                                    </AvatarGroupCount>
                                </AvatarGroup>
                            </Cell>
                        </PopoverTrigger>
                        <PopoverContent className={'z-[10001] '}>
                            {
                                banners.map((item, i) => (
                                    <Cell className={'mb-4 gap-x-2'} key={i}>
                                        <Input defaultValue={item} placeholder={'请输入图片地址'}
                                            onChange={(e) => handleBannerItemChange(e.target.value, i)} />
                                        {
                                            i === 0 ?
                                                <Button size={'sm'} onClick={handleAddBannerItem}><Plus /></Button> :
                                                <Button size={'sm'} variant="destructive"
                                                    onClick={() => handleRemoveBannerItem(i)}><Trash2 /></Button>
                                        }
                                    </Cell>
                                ))
                            }

                            <Button long={true} onClick={handleSaveHomeBanners}>保存</Button>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <Separator />

            <div >
                <DesktopShortcutButton shortcutIconUrl="/images/logo_transparent.png" className="py-2 hover:bg-accent transition-all duration-300">
                    <Cell className="justify-center gap-x-1">
                        <MonitorSmartphone />
                        下载网站桌面快捷方式
                    </Cell>
                </DesktopShortcutButton>

            </div>

        </Drawer>
    )
}
