import Image from "next/image";
import Link from "next/link";

export default async function Logo() {

    return (
        <Link href={"/blog"}>
            <h1>
                <Image width={60} height={60} className={"fit-cover rounded-full"} alt={"logo"}
                       src={"/images/logo_transparent.png"}/>
            </h1>
        </Link>

    )
}
