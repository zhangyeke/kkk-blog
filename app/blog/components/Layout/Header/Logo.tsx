import Image from "next/image";
import Link from "next/link";
import { getBlogBranding } from "@/lib/admin/settings-store";

export default async function Logo() {
    const blog = await getBlogBranding()

    return (
        <Link href={"/blog"} aria-label={`${blog.name}首页`}>
            <h1>
                <Image width={60} height={60} className={"fit-cover rounded-full"} alt={blog.name}
                       src={blog.logo} unoptimized />
            </h1>
        </Link>

    )
}
