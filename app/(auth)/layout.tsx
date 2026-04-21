"use client"
import {useState} from "react"
import Elf from "@/components/Elf"
import {defaultState, ElfFormContext} from "@/context/elf-form-context";
import {cn} from "@/lib/utils";
import Aurora from "@/components/bits/Aurora";


function BrandLogo({className, style}: BaseComponentProps) {
    return <img style={style} src={'/images/logo.png'} alt={'logo'}
                className={cn('size-12 rounded-full', className)}/>
}

export default function Layout({children}: Slots<'children'>) {
    const [state, setState] = useState(defaultState)
    // return (
    //     <div className={'h-[100vh] flex-center bg-cover bg-center'} style={{
    //         backgroundImage: `url(/images/login_bg.jpg)`
    //     }}>
    //         <div className={'shadow-md w-[400px]  rounded-md bg-white dark:bg-black'}>
    //             {children}
    //         </div>
    //     </div>
    // )

    return (
        <ElfFormContext value={{...state, setState}}>
            <div className="min-h-screen grid lg:grid-cols-2">
                {/* Left Content Section */}
                <div
                    className="relative hidden lg:flex flex-col justify-between bg-black p-12 text-primary-foreground">

                    <Aurora
                        colorStops={["#7cff67","#B19EEF","#5227FF"]}
                        blend={0.5}
                        amplitude={1.0}
                        speed={1}

                    />
                    <div className="relative z-20 flex items-center gap-x-2">
                        <BrandLogo/>
                        <span>kkk的博客</span>
                    </div>

                    <Elf/>
                    {/*放置协议 关于我们等一下链接*/}
                    {/*
                    <div className="relative z-20 flex items-center gap-8 text-sm text-primary-foreground/60">
                        <a href="#" className="hover:text-primary-foreground transition-colors">
                            Privacy Policy
                        </a>
                        <a href="#" className="hover:text-primary-foreground transition-colors">
                            Terms of Service
                        </a>
                        <a href="#" className="hover:text-primary-foreground transition-colors">
                            Contact
                        </a>
                    </div>
                    */}

                    {/* Decorative elements */}
                    <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"/>
                    <div className="absolute top-1/4 right-1/4 size-64 bg-primary-foreground/10 rounded-full blur-3xl"/>
                    <div
                        className="absolute bottom-1/4 left-1/4 size-96 bg-primary-foreground/5 rounded-full blur-3xl"/>
                </div>

                {/* Right Login Section */}
                <div className="flex items-center justify-center p-8 bg-background">
                    <div className="w-full max-w-[420px]">
                        {/* Mobile Logo */}
                        <div className={'lg:hidden mb-8 flex justify-center'}>
                            <BrandLogo />
                        </div>

                        {/* Header */}
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome back!</h2>
                            {/*<p className="text-muted-foreground text-sm">Please enter your details</p>*/}
                        </div>

                        {children}
                    </div>
                </div>

            </div>
        </ElfFormContext>

    )
}
