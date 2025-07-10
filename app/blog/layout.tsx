import {Metadata} from "next";

export const metadata: Metadata = {
    title: "博客"
}


export default async function BlogLayout({children, header,modal}: Slots<'children' | 'header' | 'modal'>) {

    return (
        <div>
            {header}
            {children}
            {modal}
        </div>
    )
}
