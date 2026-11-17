import {Metadata} from "next"


export const metadata: Metadata = {
    title: "桌面",
    description: "桌面页面。",
    robots: { index: false, follow: false },
}

export default function Web() {
    return (
        <div className="text-primary">
            这是桌面
        </div>
    )
}
