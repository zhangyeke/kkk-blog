import Image from "next/image";

export default async function Logo() {

    return (
        <h1>
            <Image width={60} height={60} className={"fit-cover rounded-full"} alt={"logo"} src={"/images/logo_transparent.png"}/>
        </h1>
    )
}
